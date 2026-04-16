const int ledPins[] = {2, 3};
const int numLeds = 2;
const int buttonPin = 5;

int currentLed = 0;
bool lastButtonState = HIGH;

void setup() {
  for (int i = 0; i < numLeds; i++) {
    pinMode(ledPins[i], OUTPUT);
  }
  pinMode(buttonPin, INPUT_PULLUP);
  updateLeds();
}

void loop() {
  bool buttonState = digitalRead(buttonPin);
  if (buttonState == LOW && lastButtonState == HIGH) {
    delay(50);
    if (digitalRead(buttonPin) == LOW) {
      currentLed = (currentLed + 1) % numLeds;
      updateLeds();
    }
  }
  lastButtonState = buttonState;
}

void updateLeds() {
  for (int i = 0; i < numLeds; i++) {
    digitalWrite(ledPins[i], i == currentLed ? HIGH : LOW);
  }
}
