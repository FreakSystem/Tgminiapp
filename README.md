void setup() {
  pinMode(A4, INPUT_PULLUP);   // кнопка цент
  pinMode(7, OUTPUT);          // центральный светодиод (D7)
}

void loop() {
  if (digitalRead(A4) == LOW) {
    digitalWrite(7, HIGH);     // горит при нажатии
  } else {
    digitalWrite(7, LOW);
  }
}
