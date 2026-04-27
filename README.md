// Упрощённая игра "Повтори последовательность" (Nano)
// Светодиоды D3..D11 (матрица 3x3), кнопки A0..A4

const byte ledPins[3][3] = {
  {3, 4, 5},
  {6, 7, 8},
  {9, 10, 11}
};

const byte BTN_LEFT = A0, BTN_RIGHT = A1, BTN_UP = A2, BTN_DOWN = A3, BTN_CENTER = A4;

int curX = 1, curY = 1;
int seqX[20], seqY[20], seqLen = 0, inputIndex = 0;

enum State {MENU, SHOW, INPUT, OVER};
State state = MENU;

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
