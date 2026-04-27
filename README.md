// ============ ИГРА ДЛЯ ARDUINO NANO ============
// Светодиоды: D3..D11 (матрица 3x3), общий катод через резистор к GND
// Кнопки: A0=влево, A1=вправо, A2=вверх, A3=вниз, A4=центр (все к GND, INPUT_PULLUP)

const byte ledPins[3][3] = {
  {3, 4, 5},
  {6, 7, 8},
  {9, 10, 11}
};

const byte BTN_LEFT   = A0;
const byte BTN_RIGHT  = A1;
const byte BTN_UP     = A2;
const byte BTN_DOWN   = A3;
const byte BTN_CENTER = A4;

enum State {MENU, GAME_SHOW_SEQ, GAME_INPUT, GAME_OVER};
State gameState = MENU;

int curX = 1, curY = 1;

const int MAX_SEQ = 20;
int seqX[MAX_SEQ];
int seqY[MAX_SEQ];
int seqLen = 0;
int inputIndex = 0;

unsigned long seqTimer = 0;
int seqStep = 0;
bool seqLightOn = false;
const unsigned long seqOnTime = 500;
const unsigned long seqOffTime = 300;

unsigned long gameOverTimer = 0;
const unsigned long gameOverBlink = 300;

// ---------- ДРЕБЕЗГ КНОПОК ----------
const byte numButtons = 5;
byte buttonPins[numButtons] = {BTN_LEFT, BTN_RIGHT, BTN_UP, BTN_DOWN, BTN_CENTER};
bool lastStableState[numButtons] = {HIGH, HIGH, HIGH, HIGH, HIGH};
bool currentState[numButtons];
unsigned long debounceTimer[numButtons] = {0};
const unsigned long debounceDelay = 50;

bool readButton(byte index) {
  bool reading = digitalRead(buttonPins[index]);
  if (reading != lastStableState[index]) {
    debounceTimer[index] = millis();
  }
  if ((millis() - debounceTimer[index]) > debounceDelay) {
    if (reading != currentState[index]) {
      currentState[index] = reading;
      if (reading == LOW) {
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
