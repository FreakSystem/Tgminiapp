/*
 * Игра "Повтори последовательность" на матрице 3x3
 * Светодиоды: аноды D3..D11 (строки сверху вниз), общий катод через резистор к GND
 * Кнопки: A0=влево, A1=вправо, A2=вверх, A3=вниз, A4=центр (все к GND, INPUT_PULLUP)
 */

// ================= ПИНЫ =================
const byte ledPins[3][3] = {
  {3, 4, 5},   // строка 0 (верхняя)
  {6, 7, 8},   // строка 1
  {9, 10, 11}  // строка 2 (нижняя)
};

enum Button { BTN_LEFT = 0, BTN_RIGHT, BTN_UP, BTN_DOWN, BTN_CENTER };
const byte buttonPins[5] = {A0, A1, A2, A3, A4};

// ================= ПЕРЕМЕННЫЕ ИГРЫ =================
enum State { MENU, SHOW_SEQ, PLAYER_INPUT, GAME_OVER };
State state = MENU;

int curCol = 1, curRow = 1;   // курсор (столбец, строка)

// последовательность
const int MAX_LEN = 20;
int seqCol[MAX_LEN];
int seqRow[MAX_LEN];
int seqLen = 0;          // текущая длина
int inputIdx = 0;        // какой шаг ждём

// показ последовательности
unsigned long showTimer = 0;
int showStep = 0;
bool showLightOn = false;
const unsigned long SHOW_ON = 500;
const unsigned long SHOW_OFF = 300;

// проигрыш
unsigned long overTimer = 0;
const unsigned long OVER_DURATION = 2000;
const unsigned long OVER_BLINK = 300;

// ================= ДРЕБЕЗГ КНОПОК =================
bool lastStable[5] = {HIGH, HIGH, HIGH, HIGH, HIGH};
bool currentStable[5] = {HIGH, HIGH, HIGH, HIGH, HIGH};
unsigned long debounceTime[5] = {0};
const unsigned long DEBOUNCE = 50;

// возвращает true один раз при нажатии (переход HIGH->LOW)
bool buttonPressed(byte idx) {
  bool raw = digitalRead(buttonPins[idx]);
  if (raw != lastStable[idx])
    debounceTime[idx] = millis();

  if ((millis() - debounceTime[idx]) > DEBOUNCE) {
    if (raw != currentStable[idx]) {
      currentStable[idx] = raw;
      if (raw == LOW) {                // нажатие
        lastStable[idx] = raw;
        return true;
      }
      lastStable[idx] = raw;
    }
  }
  return false;
}

// ================= ФУНКЦИИ СВЕТОДИОДОВ =================
// включает ОДИН светодиод, остальные гасит (важно для общего резистора)
void setOneLED(int col, int row) {
  // сначала всё выключаем
  for (int r = 0; r < 3; r++)
    for (int c = 0; c < 3; c++)
      digitalWrite(ledPins[r][c], LOW);
  // включаем нужный
  if (col >= 0 && col < 3 && row >= 0 && row < 3)
    digitalWrite(ledPins[row][col], HIGH);
}

void allLEDsOff() {
  for (int r = 0; r < 3; r++)
    for (int c = 0; c < 3; c++)
      digitalWrite(ledPins[r][c], LOW);
}

// ================= СБРОС / НОВАЯ ИГРА =================
void startNewGame() {
  seqLen = 0;
  inputIdx = 0;
  // первый случайный шаг
  seqCol[0] = random(3);
  seqRow[0] = random(3);
  seqLen = 1;
  state = SHOW_SEQ;
  showStep = 0;
  showLightOn = false;
  showTimer = millis();
}

// ================= SETUP =================
void setup() {
  // светодиоды
  for (int r = 0; r < 3; r++)
    for (int c = 0; c < 3; c++)
      pinMode(ledPins[r][c], OUTPUT);
  allLEDsOff();

  // кнопки
  for (int i = 0; i < 5; i++)
    pinMode(buttonPins[i], INPUT_PULLUP);

  randomSeed(analogRead(A5));   // случайный шум
  // Serial.begin(9600);         // для отладки (можно раскомментировать)
}

// ================= LOOP =================
void loop() {
  // читаем кнопки
  bool left   = buttonPressed(BTN_LEFT);
  bool right  = buttonPressed(BTN_RIGHT);
  bool up     = buttonPressed(BTN_UP);
  bool down   = buttonPressed(BTN_DOWN);
  bool center = buttonPressed(BTN_CENTER);

  // ----------------- МЕНЮ -----------------
  if (state == MENU) {
    // перемещение курсора
    if (left)   curCol = constrain(curCol - 1, 0, 2);
    if (right)  curCol = constrain(curCol + 1, 0, 2);
    if (up)     curRow = constrain(curRow - 1, 0, 2);
    if (down)   curRow = constrain(curRow + 1, 0, 2);
    if (center) startNewGame();   // запуск игры

    setOneLED(curCol, curRow);    // показываем курсор
  }

  // ----------------- ПОКАЗ ПОСЛЕДОВАТЕЛЬНОСТИ -----------------
  else if (state == SHOW_SEQ) {
    if (showStep < seqLen) {
      if (!showLightOn) {
        setOneLED(seqCol[showStep], seqRow[showStep]);
        showLightOn = true;
        showTimer = millis();
      } else if (millis() - showTimer >= SHOW_ON) {
        allLEDsOff();
        showLightOn = false;
        showTimer = millis();
        showStep++;
        if (showStep >= seqLen) {
          state = PLAYER_INPUT;
          curCol = 1; curRow = 1;   // курсор в центр
        }
      }
    }
  }

  // ----------------- ВВОД ИГРОКА -----------------
  else if (state == PLAYER_INPUT) {
    if (left)   curCol = constrain(curCol - 1, 0, 2);
    if (right)  curCol = constrain(curCol + 1, 0, 2);
    if (up)     curRow = constrain(curRow - 1, 0, 2);
    if (down)   curRow = constrain(curRow + 1, 0, 2);

    if (center) {
      // проверяем совпадение
      if (curCol == seqCol[inputIdx] && curRow == seqRow[inputIdx]) {
        inputIdx++;
        if (inputIdx >= seqLen) {
          // успешно → добавляем следующий шаг и показываем всю цепочку
          if (seqLen < MAX_LEN) {
            seqCol[seqLen] = random(3);
            seqRow[seqLen] = random(3);
            seqLen++;
          }
          state = SHOW_SEQ;
          showStep = 0;
          showLightOn = false;
          showTimer = millis();
          inputIdx = 0;
          allLEDsOff();  // погасим перед показом
        }
        // если ещё не вся последовательность введена – просто ждём следующий ввод
      } else {
        // ошибка
        state = GAME_OVER;
        overTimer = millis();
      }
    }

    setOneLED(curCol, curRow);  // показываем курсор
  }

  // ----------------- ПРОИГРЫШ -----------------
  else if (state == GAME_OVER) {
    if (millis() - overTimer < OVER_DURATION) {
      // мигаем всеми светодиодами
      if ((millis() / OVER_BLINK) % 2 == 0) {
        for (int r = 0; r < 3; r++)
          for (int c = 0; c < 3; c++)
            digitalWrite(ledPins[r][c], HIGH);
      } else {
        allLEDsOff();
      }
    } else {
      allLEDsOff();
      state = MENU;
      curCol = 1; curRow = 1;
    }
  }

  delay(10); // стабильность
}      digitalWrite(ledPins[r][c], LOW);
}

void setup() {
  Serial.begin(9600);
  for (int r = 0; r < 3; r++)
    for (int c = 0; c < 3; c++)
      pinMode(ledPins[r][c], OUTPUT);
  clearLEDs();

  pinMode(BTN_LEFT, INPUT_PULLUP);
  pinMode(BTN_RIGHT, INPUT_PULLUP);
  pinMode(BTN_UP, INPUT_PULLUP);
  pinMode(BTN_DOWN, INPUT_PULLUP);
  pinMode(BTN_CENTER, INPUT_PULLUP);

  randomSeed(analogRead(A5));
  Serial.println("Игра готова. Меню.");
  setLED(1, 1); // зажигаем курсор в центре
}

void loop() {
  // Простейшее чтение кнопок с антидребезгом через delay
  bool left  = (digitalRead(BTN_LEFT) == LOW);
  bool right = (digitalRead(BTN_RIGHT) == LOW);
  bool up    = (digitalRead(BTN_UP) == LOW);
  bool down  = (digitalRead(BTN_DOWN) == LOW);
  bool center = (digitalRead(BTN_CENTER) == LOW);

  if (left || right || up || down || center) {
    delay(200); // антидребезг
    // Повторно читаем, чтобы убедиться, что кнопка всё ещё нажата
    left  = (digitalRead(BTN_LEFT) == LOW);
    right = (digitalRead(BTN_RIGHT) == LOW);
    up    = (digitalRead(BTN_UP) == LOW);
    down  = (digitalRead(BTN_DOWN) == LOW);
    center = (digitalRead(BTN_CENTER) == LOW);
  }

  // Отладка в монитор
  if (left)  Serial.println("LEFT");
  if (right) Serial.println("RIGHT");
  if (up)    Serial.println("UP");
  if (down)  Serial.println("DOWN");
  if (center) Serial.println("CENTER");

  switch (state) {
    case MENU:
      if (left)  curX = max(0, curX - 1);
      if (right) curX = min(2, curX + 1);
      if (up)    curY = max(0, curY - 1);
      if (down)  curY = min(2, curY + 1);
      if (center) {
        Serial.println("Начинаем игру!");
        seqLen = 0;
        inputIndex = 0;
        seqX[seqLen] = random(3);
        seqY[seqLen] = random(3);
        seqLen++;
        state = SHOW;
        // Покажем первый шаг сразу
        setLED(seqX[0], seqY[0]);
        delay(500);
        clearLEDs();
        delay(300);
        if (seqLen > 1) {
          // Показать все шаги последовательности
          for (int i = 1; i < seqLen; i++) {
            setLED(seqX[i], seqY[i]);
            delay(500);
            clearLEDs();
            delay(300);
          }
        }
        state = INPUT;
        curX = 1; curY = 1;
        setLED(curX, curY);
      }
      break;

    case INPUT:
      if (left)  curX = max(0, curX - 1);
      if (right) curX = min(2, curX + 1);
      if (up)    curY = max(0, curY - 1);
      if (down)  curY = min(2, curY + 1);
      if (center) {
        Serial.print("Выбор: "); Serial.print(curX); Serial.print(","); Serial.println(curY);
        if (curX == seqX[inputIndex] && curY == seqY[inputIndex]) {
          inputIndex++;
          if (inputIndex >= seqLen) {
            // Уровень пройден, добавляем новый шаг
            seqX[seqLen] = random(3);
            seqY[seqLen] = random(3);
            seqLen++;
            state = SHOW;
            // Показ всей последовательности
            for (int i = 0; i < seqLen; i++) {
              setLED(seqX[i], seqY[i]);
              delay(500);
              clearLEDs();
              delay(300);
            }
            state = INPUT;
            inputIndex = 0;
            curX = 1; curY = 1;
            setLED(curX, curY);
          }
          // Если ещё не все шаги введены, просто остаёмся в INPUT
        } else {
          // Ошибка
          Serial.println("Ошибка! Игра окончена.");
          state = OVER;
          // Мигаем всеми светодиодами
          for (int i = 0; i < 6; i++) {
            for (int r = 0; r < 3; r++)
              for (int c = 0; c < 3; c++)
                digitalWrite(ledPins[r][c], HIGH);
            delay(300);
            clearLEDs();
            delay(300);
          }
          state = MENU;
          curX = 1; curY = 1;
          setLED(curX, curY);
        }
      }
      break;
  }

  // Отображаем курсор, если не в режиме показа
  if (state == MENU || state == INPUT) {
    setLED(curX, curY);
  }
  delay(50); // стабилизация
}      if (reading == LOW) {
        lastStableState[index] = reading;
        return true;
      }
      lastStableState[index] = reading;
    }
  }
  return false;
}

// ---------- ФУНКЦИИ СВЕТОДИОДОВ ----------
void setLED(int x, int y) {
  for (int r = 0; r < 3; r++)
    for (int c = 0; c < 3; c++)
      digitalWrite(ledPins[r][c], LOW);
  if (x >= 0 && x < 3 && y >= 0 && y < 3)
    digitalWrite(ledPins[x][y], HIGH);
}

void clearLEDs() {
  for (int r = 0; r < 3; r++)
    for (int c = 0; c < 3; c++)
      digitalWrite(ledPins[r][c], LOW);
}

void addRandomStep() {
  if (seqLen < MAX_SEQ) {
    seqX[seqLen] = random(3);
    seqY[seqLen] = random(3);
    seqLen++;
  }
}

void resetGame() {
  seqLen = 0;
  inputIndex = 0;
  addRandomStep();
}

void moveCursor(int dx, int dy) {
  curX = constrain(curX + dx, 0, 2);
  curY = constrain(curY + dy, 0, 2);
}

// ---------- НАСТРОЙКА ----------
void setup() {
  for (int r = 0; r < 3; r++)
    for (int c = 0; c < 3; c++)
      pinMode(ledPins[r][c], OUTPUT);
  clearLEDs();

  pinMode(BTN_LEFT, INPUT_PULLUP);
  pinMode(BTN_RIGHT, INPUT_PULLUP);
  pinMode(BTN_UP, INPUT_PULLUP);
  pinMode(BTN_DOWN, INPUT_PULLUP);
  pinMode(BTN_CENTER, INPUT_PULLUP);

  randomSeed(analogRead(A5));
  // Serial.begin(9600); // можно раскомментировать для отладки
}

// ---------- ГЛАВНЫЙ ЦИКЛ ----------
void loop() {
  bool left  = readButton(0);
  bool right = readButton(1);
  bool up    = readButton(2);
  bool down  = readButton(3);
  bool center = readButton(4);

  switch (gameState) {
    case MENU:
      if (left)  moveCursor(-1, 0);
      if (right) moveCursor(1, 0);
      if (up)    moveCursor(0, -1);
      if (down)  moveCursor(0, 1);
      if (center) {
        resetGame();
        gameState = GAME_SHOW_SEQ;
        seqStep = 0;
        seqLightOn = false;
        seqTimer = millis();
      }
      setLED(curX, curY);
      break;

    case GAME_SHOW_SEQ:
      if (seqStep < seqLen) {
        if (!seqLightOn) {
          setLED(seqX[seqStep], seqY[seqStep]);
          seqLightOn = true;
          seqTimer = millis();
        } else if (millis() - seqTimer >= seqOnTime) {
          clearLEDs();
          seqLightOn = false;
          seqTimer = millis();
          seqStep++;
          if (seqStep >= seqLen) {
            gameState = GAME_INPUT;
            inputIndex = 0;
            curX = 1; curY = 1;
          }
        }
      }
      break;

    case GAME_INPUT:
      if (left)  moveCursor(-1, 0);
      if (right) moveCursor(1, 0);
      if (up)    moveCursor(0, -1);
      if (down)  moveCursor(0, 1);
      if (center) {
        if (curX == seqX[inputIndex] && curY == seqY[inputIndex]) {
          inputIndex++;
          if (inputIndex >= seqLen) {
            addRandomStep();
            gameState = GAME_SHOW_SEQ;
            seqStep = 0;
            seqLightOn = false;
            seqTimer = millis();
            clearLEDs();
          }
        } else {
          gameState = GAME_OVER;
          gameOverTimer = millis();
        }
      }
      setLED(curX, curY);
      break;

    case GAME_OVER:
      if (millis() - gameOverTimer < 2000) {
        if ((millis() / gameOverBlink) % 2 == 0) {
          for (int r = 0; r < 3; r++)
            for (int c = 0; c < 3; c++)
              digitalWrite(ledPins[r][c], HIGH);
        } else {
          clearLEDs();
        }
      } else {
        clearLEDs();
        gameState = MENU;
        curX = 1; curY = 1;
      }
      break;
  }

  delay(5);
}
