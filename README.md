/*
 * Игра "Повтори последовательность" (матрица 3x3) — АПГРЕЙД
 * Основан на работающем коде.
 * Светодиоды: D3..D11, общий катод через резистор -> GND
 * Кнопки: A0=влево, A1=вправо, A2=вверх, A3=вниз, A4=центр (все к GND)
 */

// --------------------- ПИНЫ ---------------------
int led[3][3] = {
  {3, 4, 5},
  {6, 7, 8},
  {9, 10, 11}
};

#define BTN_LEFT   A0
#define BTN_RIGHT  A1
#define BTN_UP     A2
#define BTN_DOWN   A3
#define BTN_CENTER A4

// --------------------- СОСТОЯНИЯ ---------------------
#define STATE_MENU      0
#define STATE_SHOW      1
#define STATE_INPUT     2
#define STATE_OVER      3

int gameState = STATE_MENU;

// --------------------- ПЕРЕМЕННЫЕ ---------------------
int x = 1, y = 1;            // курсор (столбец, строка)
int seqX[32], seqY[32];      // последовательность
int seqLen = 0;              // текущая длина
int inputIdx = 0;            // какой шаг вводим

// --------------------- ФУНКЦИИ ---------------------
void allOff() {
  for (int r = 0; r < 3; r++)
    for (int c = 0; c < 3; c++)
      digitalWrite(led[r][c], LOW);
}

void setLED(int col, int row) {
  allOff();
  if (col >= 0 && col < 3 && row >= 0 && row < 3)
    digitalWrite(led[row][col], HIGH);
}

// Проверка нажатия (рабочая, с задержкой)
bool isPressed(int pin) {
  if (digitalRead(pin) == LOW) {
    delay(200);
    return (digitalRead(pin) == LOW);
  }
  return false;
}

// Показать всю последовательность (быстро)
void showSequence() {
  allOff();
  delay(200);
  for (int i = 0; i < seqLen; i++) {
    setLED(seqX[i], seqY[i]);
    delay(400);   // можно менять скорость
    allOff();
    delay(200);
  }
}

// Мигание при ошибке
void gameOver() {
  for (int i = 0; i < 6; i++) {
    for (int r = 0; r < 3; r++)
      for (int c = 0; c < 3; c++)
        digitalWrite(led[r][c], HIGH);
    delay(300);
    allOff();
    delay(300);
  }
  x = 1; y = 1;
  setLED(x, y);
}

// Начало новой игры (1 шаг)
void newGame() {
  seqLen = 1;
  seqX[0] = random(3);
  seqY[0] = random(3);
  inputIdx = 0;
}

// --------------------- SETUP ---------------------
void setup() {
  for (int r = 0; r < 3; r++)
    for (int c = 0; c < 3; c++)
      pinMode(led[r][c], OUTPUT);

  pinMode(BTN_LEFT, INPUT_PULLUP);
  pinMode(BTN_RIGHT, INPUT_PULLUP);
  pinMode(BTN_UP, INPUT_PULLUP);
  pinMode(BTN_DOWN, INPUT_PULLUP);
  pinMode(BTN_CENTER, INPUT_PULLUP);

  Serial.begin(9600);
  randomSeed(analogRead(A5));

  allOff();
  setLED(x, y);
  Serial.println("МЕНЮ");
}

// --------------------- MAIN LOOP ---------------------
void loop() {
  // ---------- ОБРАБОТКА КНОПОК (одинаковая для всех состояний) ----------
  bool left  = isPressed(BTN_LEFT);
  bool right = isPressed(BTN_RIGHT);
  bool up    = isPressed(BTN_UP);
  bool down  = isPressed(BTN_DOWN);
  bool center= isPressed(BTN_CENTER);

  // ---------- МЕНЮ ----------
  if (gameState == STATE_MENU) {
    if (left  && x > 0) x--;
    if (right && x < 2) x++;
    if (up    && y > 0) y--;
    if (down  && y < 2) y++;
    if (center) {
      Serial.println("СТАРТ ИГРЫ");
      newGame();
      showSequence();
      gameState = STATE_INPUT;
      x = 1; y = 1;
    }
    setLED(x, y);
  }

  // ---------- ВВОД ИГРОКА ----------
  else if (gameState == STATE_INPUT) {
    if (left  && x > 0) x--;
    if (right && x < 2) x++;
    if (up    && y > 0) y--;
    if (down  && y < 2) y++;
    if (center) {
      if (x == seqX[inputIdx] && y == seqY[inputIdx]) {
        // Правильный шаг
        Serial.print("Верно! (");
        Serial.print(inputIdx+1);
        Serial.print("/");
        Serial.print(seqLen);
        Serial.println(")");
        inputIdx++;
        if (inputIdx >= seqLen) {
          // Вся последовательность пройдена -> добавляем новый шаг
          if (seqLen < 32) {
            seqX[seqLen] = random(3);
            seqY[seqLen] = random(3);
            seqLen++;
          }
          inputIdx = 0;
          showSequence();
          x = 1; y = 1;
          // остаёмся в STATE_INPUT
        }
      } else {
        // Ошибка
        Serial.println("ОШИБКА!");
        gameState = STATE_OVER;
      }
    }
    setLED(x, y);
  }

  // ---------- КОНЕЦ ИГРЫ ----------
  else if (gameState == STATE_OVER) {
    gameOver();                // мигание и возврат курсора в центр
    gameState = STATE_MENU;
    Serial.println("МЕНЮ");
  }
}
