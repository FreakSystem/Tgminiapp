/*
 * Игра "Повтори последовательность" (матрица 3x3)
 * Светодиоды: D3..D11, общий катод через резистор -> GND
 * Кнопки: A0=влево, A1=вправо, A2=вверх, A3=вниз, A4=центр (все к GND, INPUT_PULLUP)
 */

// --------------------- ПИНЫ ---------------------
const byte led[3][3] = {
  {3, 4, 5},   // строка 0 (верх)
  {6, 7, 8},   // строка 1
  {9, 10, 11}  // строка 2 (низ)
};
const byte BTN_L = A0, BTN_R = A1, BTN_U = A2, BTN_D = A3, BTN_C = A4;

// --------------------- НАСТРОЙКИ СКОРОСТИ ---------------------
const unsigned long SHOW_ON  = 300;  // длительность зажигания при показе (мс)
const unsigned long SHOW_OFF = 150;  // пауза между шагами показа (мс)
const unsigned long BLINK    = 200;  // период мигания при проигрыше (мс)
const unsigned long OVER_MS  = 2000; // общая длительность индикации проигрыша (мс)

// --------------------- СОСТОЯНИЯ ---------------------
enum State : byte { MENU, SHOW_SEQ, PLAY, GAMEOVER };
State state = MENU;

// --------------------- ПЕРЕМЕННЫЕ ---------------------
byte curX = 1, curY = 1;        // позиция курсора (столбец X, строка Y)
byte seqX[32], seqY[32];        // последовательность (макс. длина)
byte seqLen = 0;                // текущая длина
byte inputIdx = 0;              // какой шаг ждём от игрока

// --------------------- АНТИДРЕБЕЗГ КНОПОК ---------------------
bool lastBtn[5] = {1,1,1,1,1};
bool currBtn[5] = {1,1,1,1,1};
unsigned long debTimer[5];

bool readBtn(byte i) {
  byte pin;
  if      (i==0) pin = BTN_L;
  else if (i==1) pin = BTN_R;
  else if (i==2) pin = BTN_U;
  else if (i==3) pin = BTN_D;
  else            pin = BTN_C;

  bool raw = !digitalRead(pin);   // HIGH=не нажата, LOW=нажата -> переворачиваем для удобства
  if (raw != lastBtn[i]) debTimer[i] = millis();
  if ((millis() - debTimer[i]) > 30) {   // 30 мс дребезг
    if (raw != currBtn[i]) {
      currBtn[i] = raw;
      if (raw) { lastBtn[i] = raw; return true; } // переход 0->1 (нажатие)
      lastBtn[i] = raw;
    }
  }
  return false;
}

// --------------------- ФУНКЦИИ СВЕТОДИОДОВ ---------------------
void allOff() {
  for (byte r=0; r<3; r++)
    for (byte c=0; c<3; c++)
      digitalWrite(led[r][c], LOW);
}

void setLED(byte col, byte row) {
  allOff();
  if (col<3 && row<3) digitalWrite(led[row][col], HIGH);
}

// --------------------- ПОКАЗАТЬ ВСЮ ПОСЛЕДОВАТЕЛЬНОСТЬ ---------------------
void showSequence() {
  allOff();
  delay(200);                     // подготовительная пауза
  for (byte i=0; i<seqLen; i++) {
    setLED(seqX[i], seqY[i]);
    delay(SHOW_ON);
    allOff();
    delay(SHOW_OFF);
  }
}

// --------------------- НАЧАТЬ НОВУЮ ИГРУ ---------------------
void newGame() {
  seqLen = 1;
  seqX[0] = random(3);
  seqY[0] = random(3);
  inputIdx = 0;
}

// --------------------- SETUP ---------------------
void setup() {
  for (byte r=0; r<3; r++)
    for (byte c=0; c<3; c++)
      pinMode(led[r][c], OUTPUT);
  allOff();

  pinMode(BTN_L, INPUT_PULLUP);
  pinMode(BTN_R, INPUT_PULLUP);
  pinMode(BTN_U, INPUT_PULLUP);
  pinMode(BTN_D, INPUT_PULLUP);
  pinMode(BTN_C, INPUT_PULLUP);

  randomSeed(analogRead(A5));
  setLED(curX, curY);   // курсор в центре при старте
}

// --------------------- MAIN LOOP ---------------------
void loop() {
  bool left  = readBtn(0);
  bool right = readBtn(1);
  bool up    = readBtn(2);
  bool down  = readBtn(3);
  bool center= readBtn(4);

  // ============ МЕНЮ ============
  if (state == MENU) {
    if (left  && curX>0) curX--;
    if (right && curX<2) curX++;
    if (up    && curY>0) curY--;
    if (down  && curY<2) curY++;
    if (center) {
      newGame();
      showSequence();
      state = PLAY;
      curX = 1; curY = 1;   // сброс курсора в центр для ввода
    }
    setLED(curX, curY);
  }

  // ============ ВВОД ИГРОКА (PLAY) ============
  else if (state == PLAY) {
    if (left  && curX>0) curX--;
    if (right && curX<2) curX++;
    if (up    && curY>0) curY--;
    if (down  && curY<2) curY++;

    if (center) {
      if (curX == seqX[inputIdx] && curY == seqY[inputIdx]) {
        // правильный шаг
        inputIdx++;
        if (inputIdx >= seqLen) {
          // успешно прошли всю последовательность — усложняем
          if (seqLen < 32) {
            seqX[seqLen] = random(3);
            seqY[seqLen] = random(3);
            seqLen++;
          }
          inputIdx = 0;
          showSequence();
          curX = 1; curY = 1;
          // остаёмся в PLAY
        }
        // else: просто ждём следующий шаг
      } else {
        // ошибка
        state = GAMEOVER;
        allOff();
        unsigned long t = millis();
        while (millis() - t < OVER_MS) {
          for (byte r=0; r<3; r++)
            for (byte c=0; c<3; c++)
              digitalWrite(led[r][c], HIGH);
          delay(BLINK);
          allOff();
          delay(BLINK);
        }
        state = MENU;
        curX = 1; curY = 1;
      }
    }
    setLED(curX, curY);
  }

  delay(10); // стабильность
}
