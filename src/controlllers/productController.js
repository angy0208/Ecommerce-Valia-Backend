const supabase = require("../config/supabase");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
});


// =========================
// GET TODOS LOS PRODUCTOS
// =========================

async function getProducts(req, res) {

  try {

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: true });

    if (error) {

      console.error("ERROR SUPABASE:", error);

      return res.status(500).json({
        error: "Error al obtener productos",
      });

    }

    const productsWithRelations =
      data.map(product => {

        return {
          ...product,

          isVariant:
            product.parent_id !== null
        };

      });


    res.json(productsWithRelations);

  } catch (error) {

    console.error("ERROR DEL SERVIDOR:", error);

    res.status(500).json({
      error: "Error interno del servidor",
    });

  }

}


// =========================
// GET PRODUCTO POR ID
// =========================

async function getProductById(req, res) {

  try {

    const { id } = req.params;


    const { data: product, error } =
      await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();


    if (error || !product) {

      return res.status(404).json({
        error: "Producto no encontrado"
      });

    }


    // =========================
    // SI ES UNA VARIANTE
    // =========================

    if (product.parent_id) {


      const { data: parent } =
        await supabase
          .from("products")
          .select("*")
          .eq("id", product.parent_id)
          .single();



      return res.json({

        ...product,

        parentProduct:
          parent || null,

        variants: []

      });


    }



    // =========================
    // SI ES PRODUCTO PADRE
    // =========================


    const { data: children } =
      await supabase
        .from("products")
        .select("*")
        .eq("parent_id", id);



    res.json({

      ...product,

      variants:
        children || [],

      parentProduct: null

    });



  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Error interno del servidor"
    });

  }

}


// =========================
// CREAR PRODUCTO
// =========================

async function createProduct(req, res) {

  try {

    const {
      name,
      category,
      gender,
      price,
      stock,
      description,
      tags,
      attributes,
      featured,
      parent_id,
    } = req.body;


    const product = {

      name,

      category,

      gender,

      price: Number(price),

      stock: Number(stock),

      available: Number(stock) > 0,

      description: description || "",

      tags: tags
        ? JSON.parse(tags)
        : [],

      attributes: attributes
        ? JSON.parse(attributes)
        : [],

      featured:
        featured === "true" ||
        featured === true,

      parent_id:
        parent_id && parent_id !== "null"
          ? Number(parent_id)
          : null,

    };


    // =========================
    // SUBIR IMÁGENES
    // =========================

    const images = [];


    if (req.files && req.files.length > 0) {

      for (const file of req.files) {

        const fileName =
          `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}-${file.originalname
              .replace(/\s+/g, "-")}`;


        const { error: uploadError } =
          await supabase.storage
            .from("products")
            .upload(
              fileName,
              file.buffer,
              {
                contentType: file.mimetype,
                upsert: false,
              }
            );


        if (uploadError) {

          console.error(
            "ERROR AL SUBIR IMAGEN:",
            uploadError
          );

          return res.status(500).json({
            error: "Error al subir imagen",
            message: uploadError.message,
          });

        }


        const {
          data: publicUrlData,
        } =
          supabase.storage
            .from("products")
            .getPublicUrl(fileName);


        images.push(
          publicUrlData.publicUrl
        );

      }

    }

    product.images = images;

    product.image =
      images.length > 0
        ? images[0]
        : null;


    // =========================
    // GUARDAR EN SUPABASE
    // =========================

    const {
      data,
      error,
    } = await supabase
      .from("products")
      .insert([product])
      .select()
      .single();


    if (error) {

      console.error(
        "ERROR SUPABASE:",
        error
      );

      return res.status(500).json({
        error: "Error al crear producto",
        message: error.message,
      });

    }


    res.status(201).json(data);


  } catch (error) {

    console.error(
      "ERROR DEL SERVIDOR:",
      error
    );

    res.status(500).json({
      error: "Error interno del servidor",
      message: error.message,
    });

  }

}

// =========================
// OBTENER NOMBRE DEL ARCHIVO
// =========================

function getFileNameFromUrl(url) {

  if (!url) return null;

  try {

    const cleanUrl = url.split("?")[0];

    const parts = cleanUrl.split("/");

    const bucketIndex = parts.indexOf("products");

    if (bucketIndex === -1) {
      return null;
    }

    return parts
      .slice(bucketIndex + 1)
      .join("/");

  } catch (error) {

    console.error(
      "ERROR AL OBTENER RUTA DE IMAGEN:",
      error
    );

    return null;

  }

}

// =========================
// ACTUALIZAR PRODUCTO
// =========================

// =========================
// ACTUALIZAR PRODUCTO
// =========================

async function updateProduct(req, res) {
  console.log(
    "ENTRO AL UPDATE PRODUCT"
  );


  try {

    const { id } = req.params;

    // =========================
    // OBTENER PRODUCTO ACTUAL
    // =========================

    const {
      data: currentProduct,
      error: currentProductError,
    } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();


    if (currentProductError || !currentProduct) {

      return res.status(404).json({
        error: "Producto no encontrado",
      });

    }


    // =========================
    // DATOS DEL PRODUCTO
    // =========================

    const updates = {
      ...req.body,
    };
    if (
      updates.parent_id !== undefined
    ) {

      updates.parent_id =
        updates.parent_id &&
          updates.parent_id !== "null"
          ? Number(updates.parent_id)
          : null;

    }

    const mainImage = updates.mainImage || null;

    const mainImageNewIndex =
      updates.mainImageNewIndex !== undefined &&
        updates.mainImageNewIndex !== ""
        ? Number(updates.mainImageNewIndex)
        : null;

    delete updates.mainImage;
    delete updates.mainImageNewIndex;


    // =========================
    // CONVERTIR DATOS
    // =========================

    if (updates.price !== undefined) {

      updates.price = Number(
        updates.price
      );

    }


    if (updates.stock !== undefined) {

      updates.stock = Number(
        updates.stock
      );

      updates.available =
        updates.stock > 0;

    }


    // =========================
    // CONVERTIR ARRAYS
    // =========================

    if (
      typeof updates.tags === "string"
    ) {

      try {

        updates.tags =
          JSON.parse(updates.tags);

      } catch (error) {

        updates.tags = [];

      }

    }


    if (
      typeof updates.attributes === "string"
    ) {

      try {

        updates.attributes =
          JSON.parse(
            updates.attributes
          );

      } catch (error) {

        updates.attributes = [];

      }

    }


    // =========================
    // IMÁGENES
    // =========================

    let newImages = [];


    // Si llegaron nuevas imágenes
    if (
      req.files &&
      req.files.length > 0
    ) {

      for (const file of req.files) {

        const fileName =
          `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}-${file.originalname
              .replace(/\s+/g, "-")}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from("products")
          .upload(
            fileName,
            file.buffer,
            {
              contentType: file.mimetype,
              upsert: false,
            }
          );

        if (uploadError) {

          console.error(
            "ERROR AL SUBIR IMAGEN:",
            uploadError
          );

          return res.status(500).json({
            error: "Error al subir imagen",
            message: uploadError.message,
          });

        }

        const {
          data: publicUrlData,
        } =
          supabase.storage
            .from("products")
            .getPublicUrl(fileName);

        newImages.push(
          publicUrlData.publicUrl
        );
      }

    }


    // =========================
    // ACTUALIZAR ARRAY DE IMÁGENES
    // =========================

    if (newImages.length > 0) {

      const currentImages =
        currentProduct.images || [];

      updates.images = [
        ...currentImages,
        ...newImages
      ];

    }


    // =========================
    // DETERMINAR IMAGEN PRINCIPAL
    // =========================
    // =========================
    // ACTUALIZAR IMÁGENES
    // =========================

    const currentImages =
      currentProduct.images || [];

    const updatedImages = [
      ...currentImages,
      ...newImages
    ];

    updates.images = updatedImages;


    // =========================
    // DETERMINAR IMAGEN PRINCIPAL
    // =========================

    // Si eligió una imagen nueva como principal
    if (
      mainImageNewIndex !== null &&
      newImages[mainImageNewIndex]
    ) {

      updates.image =
        newImages[mainImageNewIndex];

    }

    // Si eligió una imagen existente como principal
    else if (mainImage) {

      updates.image =
        mainImage;

    }

    // Si no cambió la imagen principal
    else {

      updates.image =
        currentProduct.image ||
        updatedImages[0] ||
        null;

    }
    // =========================
    // ACTUALIZAR PRODUCTO
    // =========================

    const {
      data,
      error,
    } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();


    if (error) {

      console.error(
        "ERROR SUPABASE:",
        error
      );

      return res.status(500).json({
        error:
          "Error al actualizar producto",

        message:
          error.message,
      });

    }

    // =========================
    // ELIMINAR IMÁGENES ANTIGUAS
    // =========================

    console.log("RESPONDIENDO AL FRONTEND");

    res.json(data)

  } catch (error) {

    console.error(
      "ERROR DEL SERVIDOR:",
      error
    );

    res.status(500).json({
      error:
        "Error interno del servidor",

      message:
        error.message,
    });

  }

}


// =========================
// ELIMINAR PRODUCTO
// =========================

async function deleteProduct(req, res) {

  try {

    const { id } = req.params;


    // =========================
    // OBTENER PRODUCTO ACTUAL
    // =========================

    const {
      data: product,
      error: productError,
    } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();


    if (productError || !product) {

      return res.status(404).json({
        error: "Producto no encontrado",
      });

    }


    // =========================
    // ELIMINAR IMÁGENES STORAGE
    // =========================

    if (
      product.images &&
      Array.isArray(product.images)
    ) {


      const files = product.images
        .map(getFileNameFromUrl)
        .filter(Boolean);


      if (files.length > 0) {


        const {
          data: deletedFiles,
          error: deleteStorageError,

        } = await supabase.storage
          .from("products")
          .remove(files);



        if (deleteStorageError) {

          console.error(
            "ERROR ELIMINANDO IMÁGENES:",
            deleteStorageError
          );

        } else {


          console.log(
            "IMÁGENES ELIMINADAS:",
            deletedFiles
          );

        }


      }

    }



    // =========================
    // ELIMINAR PRODUCTO BD
    // =========================

    const {
      error,

    } = await supabase
      .from("products")
      .delete()
      .eq("id", id);



    if (error) {

      console.error(
        "ERROR SUPABASE:",
        error
      );


      return res.status(500).json({
        error:
          "Error al eliminar producto",
      });

    }



    res.json({

      message:
        "Producto e imágenes eliminados correctamente",

    });



  } catch (error) {


    console.error(
      "ERROR DEL SERVIDOR:",
      error
    );


    res.status(500).json({

      error:
        "Error interno del servidor",

      message:
        error.message,

    });


  }

}

// =========================
// ELIMINAR IMAGEN INDIVIDUAL
// =========================

async function deleteProductImage(req, res) {

  try {

    const { id, filename } = req.params;


    // Obtener producto actual

    const {
      data: product,
      error
    } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();


    if (error || !product) {

      return res.status(404).json({
        error: "Producto no encontrado"
      });

    }


    // Eliminar del bucket

    const {
      error: storageError
    } = await supabase.storage
      .from("products")
      .remove([
        filename
      ]);


    if (storageError) {

      console.error(
        "ERROR STORAGE:",
        storageError
      );

      return res.status(500).json({
        error: "No se pudo eliminar imagen"
      });

    }


    // Quitar URL del array

    const updatedImages =
      product.images.filter(
        image =>
          !image.includes(filename)
      );


    await supabase
      .from("products")
      .update({

        images: updatedImages,

        image:
          updatedImages.length > 0
            ? updatedImages[0]
            : null

      })

      .eq("id", id);



    res.json({

      message:
        "Imagen eliminada correctamente"

    });



  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Error interno"
    });

  }

}

module.exports = {

  getProducts,

  getProductById,

  createProduct,

  updateProduct,

  deleteProduct,

  deleteProductImage,

  upload,

};