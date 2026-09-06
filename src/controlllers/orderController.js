const supabase = require("../config/supabase");

async function createOrder(req, res) {

  try {

    const { items } = req.body;

    // 1. Validar carrito
    if (!items || !Array.isArray(items) || items.length === 0) {

      return res.status(400).json({
        error: "El carrito está vacío"
      });

    }


    // 2. Validar cantidades
    for (const item of items) {

      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {

        return res.status(400).json({
          error: `Cantidad inválida para el producto ${item.id}`
        });

      }

    }


    // 3. Obtener IDs de productos
    const productIds = items.map(
      item => item.id
    );


    // 4. Buscar productos reales en Supabase
    const { data: products, error: productsError } =
      await supabase
        .from("products")
        .select("*")
        .in("id", productIds);


    if (productsError) {

      console.error(
        "ERROR AL BUSCAR PRODUCTOS:",
        productsError
      );

      return res.status(500).json({
        error: "No se pudieron verificar los productos",
        message: productsError.message
      });

    }


    // 5. Verificar que todos existen
    if (products.length !== productIds.length) {

      return res.status(400).json({
        error: "Uno o más productos no existen"
      });

    }


    // 6. Verificar stock real
    for (const item of items) {

      const product = products.find(
        p => p.id === item.id
      );

      const requestedQuantity =
        Number(item.quantity);

      const stock =
        Number(product.stock) || 0;


      // Disponibilidad basada en stock real
      if (stock <= 0) {

        return res.status(400).json({
          error: `El producto "${product.name}" está agotado`
        });

      }


      if (requestedQuantity > stock) {

        return res.status(400).json({
          error:
            `No hay suficiente stock de "${product.name}". ` +
            `Stock disponible: ${stock}`
        });

      }

    }


    // 7. Construir los productos de la orden
    // usando información real de Supabase
    const orderItems = items.map(item => {

      const product = products.find(
        p => p.id === item.id
      );

      const quantity =
        Number(item.quantity);

      const price =
        Number(product.price);


      return {
        id: product.id,
        name: product.name,
        price: price,
        quantity: quantity
      };

    });


    // 8. Calcular total real
    const total = orderItems.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );


    // 9. Descontar stock
    for (const item of items) {

      const product = products.find(
        p => p.id === item.id
      );

      const newStock =
        Number(product.stock) -
        Number(item.quantity);


      const newAvailable =
        newStock > 0;


      const { error: stockError } =
        await supabase
          .from("products")
          .update({
            stock: newStock,
            available: newAvailable
          })
          .eq("id", product.id);


      if (stockError) {

        console.error(
          "ERROR AL ACTUALIZAR STOCK:",
          stockError
        );

        return res.status(500).json({
          error: "No se pudo actualizar el stock",
          message: stockError.message
        });

      }

    }


    // 10. Crear orden
    const order = {

      items: orderItems,

      total: total,

      status: "pending"

    };


    const {
      data: createdOrder,
      error: orderError
    } = await supabase
      .from("orders")
      .insert([order])
      .select()
      .single();


    if (orderError) {

      console.error(
        "ERROR AL CREAR ORDEN:",
        orderError
      );

      return res.status(500).json({
        error: "No se pudo crear la orden",
        message: orderError.message
      });

    }


    // 11. Responder
    res.status(201).json({

      message: "Orden creada correctamente",

      order: createdOrder

    });


  } catch (error) {

    console.error(
      "ERROR DEL SERVIDOR:",
      error
    );

    res.status(500).json({

      error: "Error interno del servidor",

      message: error.message

    });

  }

}


module.exports = {
  createOrder
};