#include <CuteBuzzerSounds.h>
#include <Sounds.h>

#define RED_LED 10
#define ORANGE_LED 9
#define GREEN_LED 8
#define BUZZER 11

String code = "1234";

boolean authenticated = false;
boolean authenticating = false;

#include <EEPROM.h>

#include <SoftwareSerial.h>

SoftwareSerial HM10(2, 3); // RX = 2, TX = 3


void setup() {
  // put your setup code here, to run once:
  pinMode(RED_LED, OUTPUT); 
  pinMode(ORANGE_LED, OUTPUT); 
  pinMode(GREEN_LED, OUTPUT); 
  cute.init(BUZZER);
  cute.play(S_CONNECTION);

  Serial.begin(9600);
  HM10.begin(9600); // set HM10 serial at 9600 baud rate

  code = readStringFromEEPROM(0);
  

}

void loop() {

  check_status();
  recieve_bluetooth();

}

void recieve_bluetooth(){
  String transmission;
  if (HM10.available()) {
    transmission = HM10.readStringUntil('\n');
    delay(10);

    if (transmission == "AUTH") {
      auth();
    }
    if (transmission == "SET_CODE") {
      setCode();
    }
     if (transmission == "LOCK") {
      lock();
    }
    if (transmission == "ARM") {
      arm();
    }
    if (transmission == "DISARM") {
      disarm();
    }
  }
  

}

void getCode(){
  Serial.println(code);
}

void setCode(){
  if (authenticated){
    boolean messageReceived = false;
    String transmission = "";
    
    authenticating = true;
    check_status();
    tune('p');
    
    while (messageReceived == false){
      if (HM10.available()) {
      transmission = HM10.readStringUntil('\n');
      delay(10);
      messageReceived = true;
      }
    }
  
    transmission.trim();
    tune('c');
  
    code = transmission;
    writeStringToEEPROM(0, code);
    authenticating = false;
    deluminate_LED('o');
    check_status();

  } else {
    tune('d');
    auth_failed();
  }
  
}

void auth(){
  boolean messageReceived = false;
  String transmission = "";
  tune('p');
  
  authenticating = true;
  check_status();
  
  while (messageReceived == false){
    if (HM10.available()) {
    transmission = HM10.readStringUntil('\n');
    delay(10);
    messageReceived = true;
    }
  }

  transmission.trim();


  if (transmission == code){
    authenticated = true;
    authenticating = false;
    check_status();
    deluminate_LED('o');
    deluminate_LED('r');
    tune('c');
    HM10.println("AUTHVALID");
  } else {
    authenticating = false;
    authenticated = false;
    deluminate_LED('o');
    deluminate_LED('g');
    auth_failed();
    check_status();
    tune('d');
    HM10.println("AUTHINVALID");
  }

  
}

void arm(){
  Serial.write('a');
}

void disarm() {
  Serial.write('d');
}

void lock(){
    authenticating = false;
    authenticated = false;
    deluminate_LED('o');
    deluminate_LED('g');
    auth_failed();
    check_status();
    tune('d');
}

void check_status(){

  if (authenticating){
    illuminate_LED('o');
  } 
  if (!authenticated){
    illuminate_LED('r');
  }
  if (authenticated){
    illuminate_LED('g');
  }
  
}

void auth_failed(){

  tune('d');

  deluminate_LED('o');
  deluminate_LED('g');

  illuminate_LED('r');
  delay(100);
  digitalWrite(RED_LED, LOW);
  delay(100);
  illuminate_LED('r');
  delay(100);
  digitalWrite(RED_LED, LOW);
  delay(100);
  illuminate_LED('r');
  
  
}


void illuminate_LED(char colour){
  switch (colour){
    case 'r':
      digitalWrite(RED_LED, HIGH);
      break;
    case 'o':
      digitalWrite(ORANGE_LED, HIGH);
      break;
    case 'g':
      digitalWrite(GREEN_LED, HIGH);
      break;
  }
}


void deluminate_LED(char colour){
  switch (colour){
    case 'r':
      digitalWrite(RED_LED, LOW);
      break;
    case 'o':
      digitalWrite(ORANGE_LED, LOW);
      break;
    case 'g':
      digitalWrite(GREEN_LED, LOW);
      break;
  }
}

void tune(char cause){
    switch (cause){
      case 'c':
        cute.play(S_CONNECTION);
        break;
      case 'd':
        cute.play(S_DISCONNECTION);;
        break;
      case 'b':
        cute.play(S_BUTTON_PUSHED);
        break;
      case 'p':
        cute.play(S_MODE1);
        break;
    }
}

void writeStringToEEPROM(int addrOffset, const String &strToWrite){
  
  byte len = strToWrite.length();
  
  EEPROM.write(addrOffset, len);
  
  for (int i = 0; i < len; i++)
  {
    EEPROM.write(addrOffset + 1 + i, strToWrite[i]);
  }
  
}
String readStringFromEEPROM(int addrOffset){
  
  int newStrLen = EEPROM.read(addrOffset);
  
  char data[newStrLen + 1];
  
  for (int i = 0; i < newStrLen; i++){
    
    data[i] = EEPROM.read(addrOffset + 1 + i);
    
  }
  data[newStrLen] = '\0';
  return String(data);
}
