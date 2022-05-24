
let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');
let terminalContainer = document.getElementById('terminal');
let sendForm = document.getElementById('send-form');
let inputField = document.getElementById('input');
let terminalShow = document.getElementById('terminal_show');
let setCodeButton = document.getElementById('submit-code-button');
let authButton = document.getElementById('AUTH_BUTTON');

let submitCodeButton = document.getElementById('submit-code-button');
let submitAuthButton = document.getElementById('submit-auth-button');

let conStatus = document.getElementById('con_status');
let authStatus = document.getElementById('auth_status');
let armStatus = document.getElementById('arm_status');

let lockButton = document.getElementById('LOCK_BUTTON');

let codeButton = document.getElementById('CODE_BUTTON');

let armButton = document.getElementById('ARM_BUTTON');

let disarmButton = document.getElementById('DISARM_BUTTON');

armButton.addEventListener('click', function() {
  arm();
});

disarmButton.addEventListener('click', function() {
  disarm();
});

lockButton.addEventListener('click', function() {
  lock();
});

codeButton.addEventListener('click', function() {
  showSetCode();
});


submitAuthButton.addEventListener('click', function() {
  submitAuth();
});

submitCodeButton.addEventListener('click', function() {
  submitCode();
});


authButton.addEventListener('click', function() {
  showAuth();
});

connectButton.addEventListener('click', function() {
  connect();
});

disconnectButton.addEventListener('click', function() {
  disconnect();
});

terminalShow.addEventListener('click', function() {
  terminalTrigger();
});

sendForm.addEventListener('submit', function(event) {
  event.preventDefault(); //
  send(inputField.value); //
  inputField.value = '';  //
  inputField.focus();     //
});

var connected = 0;
var authed = 0;

var showing = 1;

var authDisabled = 0;
var setCodeDisabled = 0;

let deviceCache = null;

let characteristicCache = null;


let readBuffer = '';

function arm(){
  if (!authDisabled){
    send("ARM");
    alert("System Armed");
    armStatus.innerHTML = "Armed Status: Armed";
  }

}

function disarm() {
  if (!authDisabled){
    send("DISARM");
    alert("System disarmed");
    armStatus.innerHTML = "Armed Status: Not Armed";
  }

}

function submitCode(){

  document.getElementById("set_code_container").style.display = "none";
  let code = document.getElementById("codeField").value;
  send(code);
  alert("Code Updated to " + code);

}

function showSetCode(){
  if (!authDisabled){
    document.getElementById("set_code_container").style.display = "block";
    send("SET_CODE");
  }
}

function lock(){
  send("LOCK");
  authed = 0;
  authStatus.innerHTML = "Auth Status: Not Authenticated";
  lockButton.style.display = "none";
  codeButton.style.display = "none";

}

function submitAuth(){

  document.getElementById("auth_container").style.display = "none";
  let code = document.getElementById("authfield").value;
  send(code);
}


function showAuth(){
  if (!authDisabled){
    document.getElementById("auth_container").style.display = "block";
    send("AUTH");
  }

}


function terminalTrigger(){
  if (showing == 1){
    showing = 0;
    document.getElementById("terminal-cont").style.display = "none";
  } else{
    showing = 1;
    document.getElementById("terminal-cont").style.display = "block";
  }
}

function connect() {
  return (deviceCache ? Promise.resolve(deviceCache) :
      requestBluetoothDevice()).
      then(device => connectDeviceAndCacheCharacteristic(device)).
      then(characteristic => startNotifications(characteristic)).
      catch(error => log(error));
}

function requestBluetoothDevice() {
  log('Requesting bluetooth device...');

  return navigator.bluetooth.requestDevice({
    filters: [{services: [0xFFE0]}],
  }).
      then(device => {
        log('"' + device.name + '" bluetooth device selected');
        deviceCache = device;
        deviceCache.addEventListener('gattserverdisconnected',
            handleDisconnection);

        return deviceCache;
      });
}

function handleDisconnection(event) {
  let device = event.target;

  log('"' + device.name +
      '" bluetooth device disconnected, trying to reconnect...');

  connectDeviceAndCacheCharacteristic(device).
      then(characteristic => startNotifications(characteristic)).
      catch(error => log(error));
}

function connectDeviceAndCacheCharacteristic(device) {
  if (device.gatt.connected && characteristicCache) {
    return Promise.resolve(characteristicCache);
  }

  log('Connecting to GATT server...');

  return device.gatt.connect().
      then(server => {
        log('GATT server connected, getting service...');

        return server.getPrimaryService(0xFFE0);
      }).
      then(service => {
        log('Service found, getting characteristic...');

        return service.getCharacteristic(0xFFE1);
      }).
      then(characteristic => {
        log('Characteristic found');
        characteristicCache = characteristic;

        return characteristicCache;
      });
}

function startNotifications(characteristic) {
  log('Starting notifications...');

  return characteristic.startNotifications().
      then(() => {
        log('Notifications started');
        connected = 1;
        conStatus.innerHTML = "Connection Status: Connected";
        characteristic.addEventListener('characteristicvaluechanged',
            handleCharacteristicValueChanged);
      });

}

function handleCharacteristicValueChanged(event) {

  let value = new TextDecoder().decode(event.target.value);

  for (let c of value) {
    if (c === '\n') {
      let data = readBuffer.trim();
      readBuffer = '';

      if (data) {
        receive(data);

      }
    }
    else {
      readBuffer += c;
    }
  }
}

function receive(data) {
  log(data, 'in');


  if (data.substring(0, 4) == "AUTH"){

    if (data.substring(4) == "VALID"){
      authStatus.innerHTML = "Auth Status: Authenticated";
      authed = 1;
      lockButton.style.display = "inline-block";
      codeButton.style.display = "inline-block";
      armButton.style.display = "inline-block";
      disarmButton.style.display = "inline-block";


    } else {
      authStatus.innerHTML = "Auth Status: Not Authenticated";
      authed = 0;

    }

  }

}

function log(data, type = '') {
  terminalContainer.insertAdjacentHTML('beforeend',
      '<div' + (type ? ' class="' + type + '"' : '') + '>' + data + '</div>');
  terminalContainer.scrollTop = terminalContainer.scrollHeight;
}

function disconnect() {
  if (deviceCache) {
    log('Disconnecting from "' + deviceCache.name + '" bluetooth device...');
    deviceCache.removeEventListener('gattserverdisconnected',
        handleDisconnection);

    if (deviceCache.gatt.connected) {
      deviceCache.gatt.disconnect();
      log('"' + deviceCache.name + '" bluetooth device disconnected');
      connected = 0;
      conStatus.innerHTML = "Connection Status: Disconnected";
    }
    else {
      log('"' + deviceCache.name +
          '" bluetooth device is already disconnected');
    }
  }

  if (characteristicCache) {
    characteristicCache.removeEventListener('characteristicvaluechanged',
        handleCharacteristicValueChanged);
    characteristicCache = null;
  }

  deviceCache = null;
}

function send(data) {
  data = String(data);

  if (!data || !characteristicCache) {
    return;
  }

  data += '\n';

  if (data.length > 20) {
    let chunks = data.match(/(.|[\r\n]){1,20}/g);

    writeToCharacteristic(characteristicCache, chunks[0]);

    for (let i = 1; i < chunks.length; i++) {
      setTimeout(() => {
        writeToCharacteristic(characteristicCache, chunks[i]);
      }, i * 100);
    }
  }
  else {
    writeToCharacteristic(characteristicCache, data);
  }

}


function writeToCharacteristic(characteristic, data) {
  characteristic.writeValue(new TextEncoder().encode(data));
}
