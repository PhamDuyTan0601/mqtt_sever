// mqttHandler.js
const mqtt = require("mqtt");
const Device = require("./models/device");
const PetData = require("./models/petData");

console.log("🔗 Initializing MQTT Handler...");

// Kết nối đến MQTT Broker Cloud FREE
const MQTT_BROKER = "mqtt://broker.hivemq.com:1883";
// Hoặc có thể dùng:
// const MQTT_BROKER = 'mqtt://broker.emqx.io:1883';

const client = mqtt.connect(MQTT_BROKER, {
  clientId: "petTracker_server_" + Math.random().toString(16).substr(2, 8),
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
});

client.on("connect", () => {
  console.log("✅ MQTT Connected to HiveMQ Cloud Broker");
  client.subscribe("petTracker/+/data", (err) => {
    if (err) {
      console.error("❌ MQTT Subscribe error:", err);
    } else {
      console.log("📡 Subscribed to topic: petTracker/+/data");
    }
  });
});

client.on("error", (error) => {
  console.error("❌ MQTT Connection error:", error);
});

client.on("message", async (topic, message) => {
  try {
    console.log(`📨 MQTT Message received on: ${topic}`);

    const data = JSON.parse(message.toString());
    const deviceId = topic.split("/")[1]; // Lấy deviceId từ topic

    console.log(`📊 Data from ${deviceId}:`, data);
    await processMQTTData(deviceId, data);
  } catch (error) {
    console.error("❌ MQTT Message processing error:", error);
  }
});

async function processMQTTData(deviceId, data) {
  try {
    // Tìm device trong database
    const device = await Device.findOne({
      deviceId: deviceId,
      isActive: true,
    }).populate("petId");

    if (!device) {
      console.log(`❌ Device not found or inactive: ${deviceId}`);
      return;
    }

    console.log(`🐕 Processing data for pet: ${device.petId.name}`);

    // Lưu pet data vào MongoDB
    const petData = new PetData({
      petId: device.petId._id,
      latitude: data.lat,
      longitude: data.lng,
      speed: data.speed || 0,
      batteryLevel: data.battery || 100,
      accelX: data.accelX || 0,
      accelY: data.accelY || 0,
      accelZ: data.accelZ || 0,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    });

    await petData.save();

    // Update lastSeen cho device
    await Device.findByIdAndUpdate(device._id, {
      lastSeen: new Date(),
    });

    console.log(`✅ Data saved for: ${device.petId.name}`);

    // Gửi confirm lại ESP32
    const confirmPayload = JSON.stringify({
      status: "success",
      message: "Data received and saved",
      timestamp: new Date().toISOString(),
      petName: device.petId.name,
    });

    client.publish(`petTracker/${deviceId}/confirm`, confirmPayload);
    console.log(`✅ Confirmation sent to: ${deviceId}`);
  } catch (error) {
    console.error("❌ Error processing MQTT data:", error);
  }
}

// Export client nếu cần dùng elsewhere
module.exports = client;
