
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.products import router as products_router
from routes.auth_routes import router as auth_router

app = FastAPI(
    title="Inventory / Product Management API",
    description="A CRUD API covering GET, POST, PUT, PATCH, DELETE for products, protected by JWT + API key.",
    version="1.0.0",
)

# Enable CORS so frontend (e.g. Vite dev server on localhost:5173 or other ports) can communicate seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# /login -- unprotected, this is how you GET a token in the first place.
app.include_router(auth_router)

# /products/* -- every route here requires a valid JWT + X-API-Key header,
# enforced by the dependencies=[Depends(verify_request)] set on the router
# itself in routes/products.py.
app.include_router(products_router)


@app.get("/")
async def root():
    return {"message": "Inventory API is running. See /docs for the full endpoint list."}