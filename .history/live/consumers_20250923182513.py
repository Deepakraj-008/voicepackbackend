# live/consumers.py
from channels.generic.websocket import AsyncJsonWebsocketConsumer
class LiveConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send_json({"hello":"live"})
