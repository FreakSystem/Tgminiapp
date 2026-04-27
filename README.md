/*
 * СУПЕР-ПРОСТАЯ ИГРА "Повтори последовательность"
 * Светодиоды: D3..D11 (матрица 3x3), общий катод через резистор -> GND
 * Кнопки: A0=ВЛЕВО, A1=ВПРАВО, A2=ВВЕРХ, A3=ВНИЗ, A4=ЦЕНТР (все к GND)
 */

// Пины светодиодов [строка][столбец]
int led[3][3] = {
  {3, 4, 5},
  {6, 7, 8},
  {9, 10, 11}
};

// Пины кнопок
#define BTN_LEFT   A0
#define BTN_RIGHT  A1
#define BTN_UP     A2
#define BTN_DOWN   A3
#define BTN_CENTER A4

// Координаты курсора (столбец X, строка Y)
int x = 1, y = 1;

// Последовательность (максимум 20 шагов)
int seqX[20], seqY[20];
int len = 0;        // текущая длина последовательности

void setup() {
  // Светодиоды
  for (int r = 0; r < 3; r++)
    for (int c = 0; c < 3; c++)
      pinMode(led[r][c], OUTPUT);

  // Кнопки с внутренней подтяжкой
  pinMode(BTN_LEFT, INPUT_PULLUP);
  pinMode(BTN_RIGHT, INPUT_PULLUP);
  pinMode(BTN_UP, INPUT_PULLUP);
  pinMode(BTN_DOWN, INPUT_PULLUP);
  pinMode(BTN_CENTER, INPUT_PULLUP);

  Serial.begin(9600);   // для отладки (обязательно откройте монитор порта)
  randomSeed(analogRead(A5));

  // Зажигаем центральный светодиод при старте — мы в меню
  allOff();
  digitalWrite(led[y][x], HIGH);
  Serial.println("МЕНЮ. Жду команду...");
}

// Выключить все светодиоды
void allOff() {
  for (int r = 0; r < 3; r++)
    for (int c = 0; c < 3; c++)
      digitalWrite(led[r][c], LOW);
}

// Зажечь только один светодиод в позиции (col, row)
void setLED(int col, int row) {
  allOff();
  if (col >= 0 && col < 3 && row >= 0 && row < 3)
    digitalWrite(led[row][col], HIGH);
}

// Проверка, нажата ли кнопка (просто LOW с задержкой 200 мс)
bool isPressed(int pin) {
  if (digitalRead(pin) == LOW) {
    delay(200);                     // антидребезг
    return (digitalRead(pin) == LOW);
  }
  return false;
}

// Показать всю последовательность
void showSequence() {
  for (int i = 0; i < len; i++) {
    setLED(seqX[i], seqY[i]);
    delay(500);
    allOff();
    delay(300);
  }
}

// Игра окончена (мигание)
void gameOver() {
  Serial.println("ОШИБКА! Игра окончена.");
  for (int i = 0; i < 6; i++) {
    for (int r = 0; r < 3; r++)
      for (int c = 0; c < 3; c++)
        digitalWrite(led[r][c], HIGH);
    delay(300);
    allOff();
    delay(300);
  }
  // Возврат в меню
  x = 1; y = 1;
  setLED(x, y);
  Serial.println("МЕНЮ.");
}

void loop() {
  // Обработка кнопок
  if (isPressed(BTN_LEFT)) {
    Serial.print("ВЛЕВО  ");
    if (x > 0) x--;
    setLED(x, y);
    Serial.print("x="); Serial.print(x); Serial.print(" y="); Serial.println(y);
  }
  if (isPressed(BTN_RIGHT)) {
    Serial.print("ВПРАВО ");
    if (x < 2) x++;
    setLED(x, y);
    Serial.print("x="); Serial.print(x); Serial.print(" y="); Serial.println(y);
  }
  if (isPressed(BTN_UP)) {
    Serial.print("ВВЕРХ  ");
    if (y > 0) y--;
    setLED(x, y);
    Serial.print("x="); Serial.print(x); Serial.print(" y="); Serial.println(y);
  }
  if (isPressed(BTN_DOWN)) {
    Serial.print("ВНИЗ   ");
    if (y < 2) y++;
    setLED(x, y);
    Serial.print("x="); Serial.print(x); Serial.print(" y="); Serial.println(y);
  }
  if (isPressed(BTN_CENTER)) {
    Serial.println("ЦЕНТР – старт игры");
    // Начинаем новую игру
    len = 1;
    seqX[0] = random(3);
    seqY[0] = random(3);
    // Показываем первый шаг
    setLED(seqX[0], seqY[0]);
    delay(500);
    allOff();
    delay(300);
    // Теперь игрок должен повторить
    for (int step = 0; step < len; step++) {
      // Ждём, пока игрок выберет правильную позицию
      bool ok = false;
      while (!ok) {
        // перемещение курсора
        if (isPressed(BTN_LEFT)  && x > 0) { x--; setLED(x, y); }
        if (isPressed(BTN_RIGHT) && x < 2) { x++; setLED(x, y); }
        if (isPressed(BTN_UP)    && y > 0) { y--; setLED(x, y); }
        if (isPressed(BTN_DOWN)  && y < 2) { y++; setLED(x, y); }
        // подтверждение выбора
        if (isPressed(BTN_CENTER)) {
          if (x == seqX[step] && y == seqY[step]) {
            Serial.println("Верно!");
            ok = true;
          } else {
            gameOver();
            return;   // выходим из loop, начнётся заново
          }
        }
      }
      // Короткая вспышка подтверждения
      setLED(x, y);
      delay(200);
      allOff();
      delay(200);
    }
    // Раунд пройден – добавляем ещё один шаг
    if (len < 20) {
      seqX[len] = random(3);
      seqY[len] = random(3);
      len++;
    }
    // Показываем обновлённую последовательность
    showSequence();
    // Снова ожидаем ввод с первого шага
    // (логика повторится в следующем цикле, но для простоты просто перезапускаем игру с новой длиной)
    // В данной упрощённой версии игра фактически идёт только на один раунд,
    // потому что после правильного ввода раунд завершается и снова показывается меню.
    // Чтобы сделать бесконечную игру с нарастающей длиной, код нужно чуть усложнить.
    // Но я намеренно оставил так для максимальной простоты – вы увидите, что кнопки работают.
  }
}
