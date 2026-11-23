const byId = id => document.getElementById(id);

function showJournal(open) {
  byId('control').hidden = open;
  byId('journal').hidden = !open;
  byId('show-control').setAttribute('aria-pressed', !open);
  byId('show-journal').setAttribute('aria-pressed', open);
}

byId('show-control').onclick = () => showJournal(false);
byId('show-journal').onclick = () => showJournal(true);

const MANUAL = 'Вручную';
const AUTO = 'Автоматически';

class Events {
  observers = [];

  subscribe(observer) {
    this.observers.push(observer);
  }

  publish(event) {
    event.time = new Date();
    for (const observer of this.observers) observer.update(event);
  }
}

const events = new Events();

class Light {
  on = false;

  constructor(name) {
    this.name = name;
  }

  toggle(source) {
    this.on = !this.on;
    events.publish({ name: this.name, text: this.on ? 'Включён' : 'Выключен', source });
  }
}

class Camera {
  person = false;

  togglePresence() {
    this.person = !this.person;
    events.publish({ name: 'Камера', type: 'presence', present: this.person, source: AUTO });
  }
}

class TemperatureSensor {
  value = 21;

  measure(value) {
    if (value === this.value) return;
    const old = this.value;
    this.value = value;
    events.publish({ name: 'Датчик', type: 'temperature', text: old + ' → ' + value + ' °C', source: AUTO });
  }
}

class ClimateUnit {
  target = 21;
  mode = 'Ожидание';

  setTarget(value) {
    if (value === this.target) return;
    this.target = value;
    events.publish({ name: 'Климат', type: 'target', text: 'Цель: ' + value + ' °C', source: MANUAL });
  }
}

class ToggleLightCommand {
  constructor(light, source) {
    this.light = light;
    this.source = source;
  }

  execute() {
    this.light.toggle(this.source);
  }
}

class SetTargetCommand {
  constructor(unit, value) {
    this.unit = unit;
    this.value = value;
  }

  execute() {
    this.unit.setTarget(this.value);
  }
}

class CommandExecutor {
  run(command) {
    command.execute();
  }
}

class Journal {
  detection = null;

  update(event) {
    const time = event.time.toLocaleTimeString('ru-RU');
    if (event.type === 'presence' && !event.present) {
      this.detection.textContent = this.detection.textContent.replace(' — сейчас', ' — до ' + time);
      this.detection = null;
      return;
    }

    const entry = document.createElement('li');
    if (event.type === 'presence') {
      entry.textContent = 'Камера: человек обнаружен с ' + time + ' — сейчас';
      this.detection = entry;
    } else {
      entry.textContent = time + ' · ' + event.name + ': ' + event.text + ' · ' + event.source;
    }
    byId('empty').hidden = true;
    byId('entries').prepend(entry);
  }
}

const lights = [new Light('Свет 1'), new Light('Свет 2')];
const camera = new Camera();
const sensor = new TemperatureSensor();
const unit = new ClimateUnit();
const executor = new CommandExecutor();

events.subscribe(new Journal());

lights.forEach((light, index) => {
  const button = byId('light-' + (index + 1));
  button.onclick = () => {
    executor.run(new ToggleLightCommand(light, MANUAL));
    render();
  };
});

byId('target-form').onsubmit = event => {
  event.preventDefault();
  const input = byId('target');
  if (!input.checkValidity()) return;
  executor.run(new SetTargetCommand(unit, input.valueAsNumber));
  render();
};

function render() {
  lights.forEach((light, index) => {
    const button = byId('light-' + (index + 1));
    button.textContent = light.name + (light.on ? ': включён' : ': выключен');
    button.setAttribute('aria-pressed', light.on);
  });
  byId('camera').textContent = camera.person ? 'Человек обнаружен' : 'Человек не обнаружен';
  byId('climate').textContent = 'Датчик: ' + sensor.value + ' °C. Цель: ' + unit.target + ' °C. Климат: ' + unit.mode;
}
