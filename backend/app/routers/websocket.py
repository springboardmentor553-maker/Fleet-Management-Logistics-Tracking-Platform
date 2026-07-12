from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/tracking")
async def websocket_tracking(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_text()

            await websocket.send_text(
                f"Live Location Received: {data}"
            )

    except WebSocketDisconnect:
        print("Client disconnected")