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
}
