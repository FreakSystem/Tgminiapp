// ============ ИГРА "ПОВТОРИ ПОСЛЕДОВАТЕЛЬНОСТЬ" НА МАТРИЦЕ 3x3 ============
// Светодиоды: аноды на D3..D11 (матрица 3x3), общий катод через резистор к GND
// Кнопки: A0=влево, A1=вправо, A2=вверх, A3=вниз, A4=центр (подключены к GND, INPUT_PULLUP)

// ---------- ПИНЫ ----------
// Матрица светодиодов [строка][столбец]
const byte ledPins[3][3] = {
  {3, 4, 5},   // строка 0 (верхняя)
  {6, 7, 8},   // строка 1
  {9, 10, 11}  // строка 2 (нижняя)
};

// Кнопки
const byte BTN_LEFT   = A0;
const byte BTN_RIGHT  = A1;
const byte BTN_UP     = A2;
const byte BTN_DOWN   = A3;
const byte BTN_CENTER = A4;

// ---------- ПЕРЕМЕННЫЕ СОСТОЯНИЙ ----------
enum State {MENU, GAME_SHOW_SEQ, GAME_INPUT, GAME_OVER};
State gameState = MENU;

// Текущая позиция курсора (0..2)
int curX = 1, curY = 1;   // начинаем с центра

// Последовательность и её длина
const int MAX_SEQ = 20;
int seqX[MAX_SEQ];
int seqY[MAX_SEQ];
int seqLen = 0;               // текущая длина последовательности
int inputIndex = 0;           // какой шаг ожидаем от игрока

// Таймеры для показа последовательности и анимаций
unsigned long seqTimer = 0;
int seqStep = 0;              // текущий показываемый шаг
bool seqLightOn = false;      // горит ли светодиод в данный момент
const unsigned long seqOnTime = 500;   // длительность зажигания
const unsigned long seqOffTime = 300;  // длительность паузы

// Таймер проигрыша
unsigned long gameOverTimer = 0;
const unsigned long gameOverBlink = 300;

// Подавление дребезга кнопок
unsigned long lastDebounceTime[5] = {0};
const unsigned long debounceDelay = 100;

// Состояния кнопок в предыдущем цикле (для определения нажатия)
bool lastBtnState[5] = {HIGH, HIGH, HIGH, HIGH, HIGH};

// ---------- ФУНКЦИИ ----------
void setLED(int x, int y) {
  // Выключаем все
  for (int r = 0; r < 3; r++)
    for (int c = 0; c < 3; c++)
      digitalWrite(ledPins[r][c], LOW);
  // Включаем нужный
  if (x >= 0 && x < 3 && y >= 0 && y < 3)
    digitalWrite(ledPins[x][y], HIGH);
}

void clearLEDs() {
  for (int r = 0; r < 3; r++)
    for (int c = 0; c < 3; c++)
      digitalWrite(ledPins[r][c], LOW);
}

// Чтение кнопки с подавлением дребезга и фиксацией фронта нажатия
bool isButtonPressed(byte pin, int btnIndex) {
  bool currentState = digitalRead(pin);
  if (currentState != lastBtnState[btnIndex]) {
    lastDebounceTime[btnIndex] = millis();
  }
  if ((millis() - lastDebounceTime[btnIndex]) > debounceDelay) {
    if (currentState == LOW && lastBtnState[btnIndex] == HIGH) {
      lastBtnState[btnIndex] = currentState;
      return true;
    }
  }
  lastBtnState[btnIndex] = currentState;
  return false;
}

// Генерация новой случайной позиции, добавляемой в конец последовательности
void addRandomStep() {
  if (seqLen < MAX_SEQ) {
    seqX[seqLen] = random(3);
    seqY[seqLen] = random(3);
    seqLen++;
  }
}

// Сброс игры (начало новой)
void resetGame() {
  seqLen = 0;
  inputIndex = 0;
  addRandomStep();   // первая позиция
}

// Перемещение курсора с учётом границ
void moveCursor(int dx, int dy) {
  curX = constrain(curX + dx, 0, 2);
  curY = constrain(curY + dy, 0, 2);
}

// ---------- НАСТРОЙКА ----------
void setup() {
  // Инициализация светодиодов
  for (int r = 0; r < 3; r++)
    for (int c = 0; c < 3; c++)
      pinMode(ledPins[r][c], OUTPUT);
  clearLEDs();

  // Кнопки с внутренней подтяжкой
  pinMode(BTN_LEFT, INPUT_PULLUP);
  pinMode(BTN_RIGHT, INPUT_PULLUP);
  pinMode(BTN_UP, INPUT_PULLUP);
  pinMode(BTN_DOWN, INPUT_PULLUP);
  pinMode(BTN_CENTER, INPUT_PULLUP);

  randomSeed(analogRead(A5));   // случайный шум на неподключенном пине
  Serial.begin(9600);           // отладка (по желанию)
}

// ---------- ГЛАВНЫЙ ЦИКЛ ----------
void loop() {
  // Обработка кнопок (навигация всегда активна в MENU и GAME_INPUT)
  bool left  = isButtonPressed(BTN_LEFT, 0);
  bool right = isButtonPressed(BTN_RIGHT, 1);
  bool up    = isButtonPressed(BTN_UP, 2);
  bool down  = isButtonPressed(BTN_DOWN, 3);
  bool center = isButtonPressed(BTN_CENTER, 4);

  switch (gameState) {
    // ==================== МЕНЮ ====================
    case MENU:
      // Курсор уже отображается (будет обновлено ниже)
      if (left)  moveCursor(-1, 0);
      if (right) moveCursor(1, 0);
      if (up)    moveCursor(0, -1);
      if (down)  moveCursor(0, 1);
      if (center) {
        // Начинаем игру
        resetGame();
        gameState = GAME_SHOW_SEQ;
        seqStep = 0;
        seqLightOn = false;
        seqTimer = millis();
      }
      // Показываем курсор
      setLED(curX, curY);
      break;

    // ==================== ПОКАЗ ПОСЛЕДОВАТЕЛЬНОСТИ ====================
    case GAME_SHOW_SEQ:
      // Кнопки не обрабатываем (кроме аварийного сброса, если нужно)
      // Автоматическое переключение по таймеру
      if (seqStep < seqLen) {
        if (!seqLightOn) {
          // Включаем светодиод текущего шага
          setLED(seqX[seqStep], seqY[seqStep]);
          seqLightOn = true;
          seqTimer = millis();
        } else if (millis() - seqTimer >= seqOnTime) {
          // Выключаем и переходим к паузе
          clearLEDs();
          seqLightOn = false;
          seqTimer = millis();
          seqStep++;
          if (seqStep >= seqLen) {
            // Вся последовательность показана, переход к вводу
            gameState = GAME_INPUT;
            inputIndex = 0;
            curX = 1; curY = 1;  // сброс курсора в центр для удобства
          }
        }
      }
      break;

    // ==================== ВВОД ИГРОКА ====================
    case GAME_INPUT:
      // Показываем курсор, обрабатываем кнопки
      if (left)  moveCursor(-1, 0);
      if (right) moveCursor(1, 0);
      if (up)    moveCursor(0, -1);
      if (down)  moveCursor(0, 1);
      if (center) {
        // Проверяем, совпадает ли выбранная позиция с ожидаемой
        if (curX == seqX[inputIndex] && curY == seqY[inputIndex]) {
          inputIndex++;
          if (inputIndex >= seqLen) {
            // Вся последовательность введена правильно -> добавляем новый шаг и снова показываем
            addRandomStep();
            gameState = GAME_SHOW_SEQ;
            seqStep = 0;
            seqLightOn = false;
            seqTimer = millis();
            clearLEDs();   // погасим перед показом
          }
          // если ещё остались шаги, просто продолжаем ввод (курсор остаётся)
        } else {
          // Ошибка!
          gameState = GAME_OVER;
          gameOverTimer = millis();
        }
      }
      setLED(curX, curY);
      break;

    // ==================== ПРОИГРЫШ ====================
    case GAME_OVER:
      // Мигаем всеми светодиодами 2 секунды, затем в меню
      if (millis() - gameOverTimer < 2000) {
        // Быстрое мигание
        if ((millis() / gameOverBlink) % 2 == 0) {
          // Включаем все
          for (int r = 0; r < 3; r++)
            for (int c = 0; c < 3; c++)
              digitalWrite(ledPins[r][c], HIGH);
        } else {
          clearLEDs();
        }
      } else {
        // Возврат в меню
        clearLEDs();
        gameState = MENU;
        curX = 1; curY = 1;
      }
      break;
  }

  // Небольшая задержка для стабильности (можно убрать)
  delay(5);
}
