## Cliente
- cliente_id (PK)
- nombre
- email (UK)

## Pedido
- pedido_id (PK)
- cliente_id (FK)
- fecha
- estado

## Producto
- producto_id (PK)
- sku (UK)
- nombre
- precio

## LineaPedido
- pedido_id (PK)
- producto_id (PK)
- cantidad
- precio_unitario

## Relaciones
Relación: Cliente -> (1, 0..n) Pedido
Relación: Pedido -> (1, 1..n) LineaPedido
Relación: Producto -> (1, 0..n) LineaPedido

## Reglas
Regla: Cada pedido pertenece a un cliente.
Regla: La cantidad de una línea debe ser mayor que cero.
Regla: El precio unitario de la línea conserva el precio al realizar el pedido.
Regla: El correo del cliente y el SKU del producto son únicos.
