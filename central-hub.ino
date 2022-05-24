const pin_t LED = D2;

SYSTEM_THREAD(ENABLED);
bool armed = false;

int armDisarm(String status);


void setup()
{
    Serial.begin(9600);
    pinMode(LED, OUTPUT);
    Particle.function("arm", armDisarm);
}

int armDisarm(String status){
    
     if (status == "a"){
         Serial.println("System Armed");
         digitalWrite(LED, HIGH);
         Particle.publish("arm");
         armed = true;
         return 1;
         

         
    } else if (status == "d"){
        Serial.println("System Disarmed");
        digitalWrite(LED, LOW);
        Particle.publish("disarm");
        armed = false;
        return 1;
        
    } 
    
    return 0;
    

    
}

void loop()
{



}