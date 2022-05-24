import time
import RPi.GPIO as GPIO
from pyparticleio.ParticleCloud import ParticleCloud
import requests
from sseclient import SSEClient

GPIO.setmode(GPIO.BOARD)
GPIO.setwarnings(False)

LIGHT = 16
LED    = 18
TRIGGER = 38
ECHO    = 36
buzzerpin = 7

global alarming 
global armed 
global lightOn 

GPIO.setup(LIGHT,GPIO.OUT)  
GPIO.setup(LED,GPIO.OUT)     
GPIO.setup(buzzerpin, GPIO.OUT)
GPIO.setup(TRIGGER,GPIO.OUT)  
GPIO.setup(ECHO,GPIO.IN)


GPIO.output(TRIGGER, False)
GPIO.output(buzzerpin, GPIO.LOW)

particle_cloud = ParticleCloud(username_or_access_token="8b28464b8503c032122dd7aa9bf08711a4414090")

def powerLightOn():
    GPIO.output(LIGHT, GPIO.HIGH)
    
def powerLightOff():
    GPIO.output(LIGHT, GPIO.LOW)

def alarmActive():
    GPIO.output(buzzerpin, GPIO.HIGH)
    powerLightOn()
    checkDisArm()
    GPIO.output(buzzerpin, GPIO.LOW)
    powerLightOff()
    time.sleep(1)
    
    
def alarmDisable():
    global alarming 
    global armed
    global lightOn
    GPIO.output(buzzerpin, GPIO.LOW)
    powerLightOff()
    alarming = False
    lightOn = False
    armed = False


def activate():
    global armed
    armed = True
               

def checkArm():
    count = 0
    messages = SSEClient('https://api.particle.io/v1/devices/e00fce68e0b08bcb6c27e2ba/events/arm?access_token=8b28464b8503c032122dd7aa9bf08711a4414090')
    for msg in messages:
        print(msg.data)
        if (len(msg.data) > 0):
            print("Arm Recieved: " + msg.data)
            activate()
        count = count + 1
        time.sleep(0.1)
        if (count == 3):
            break
def checkDisArm():
    count = 0
    messages = SSEClient('https://api.particle.io/v1/devices/e00fce68e0b08bcb6c27e2ba/events/disarm?access_token=8b28464b8503c032122dd7aa9bf08711a4414090')
    for msg in messages:
        print(msg.data)
        if (len(msg.data) > 0):
            print("Disarm Recieved: " + msg.data)
            alarmDisable()
        count = count + 1
        time.sleep(0.1)
        if (count == 3):
            break    
  
def checkDistance():
    
    time.sleep(1)

    # Send 10us pulse to trigger
    GPIO.output(TRIGGER, True)
    time.sleep(0.00001)
    GPIO.output(TRIGGER, False)
    start = time.time()

    while GPIO.input(ECHO)==0:
      start = time.time()

    while GPIO.input(ECHO)==1:
      stop = time.time()

    timeTaken = stop-start

    distanceThereAndBack = timeTaken * 34300

    distance = distanceThereAndBack / 2

    print(distance)
    
    return distance

def main():
    global alarming 
    global armed
    global lightOn
    alarming = False
    armed = False
    lightOn = False

    while True:
        
        #particle_cloud.Jasons_Argon.subscribe("arm", checkArm)
        checkArm()
        
        if (armed == True):
            print('armed')
            GPIO.output(LED, GPIO.HIGH)
            distance = checkDistance()
            GPIO.output(LED, GPIO.LOW)
                
            if (distance >= 50 and distance  <= 100):
                lightOn = True
            elif (distance < 50):
                alarming = True
                lightOn = True
                
            if (lightOn):
                powerLightOn()
            elif (lightOn == False):
                powerLightOff()
                    
            while alarming:
                alarmActive()

        
        elif(armed == False):
            GPIO.output(LED, GPIO.LOW)
            print('not armed')
    

if __name__ == "__main__":
    main()

