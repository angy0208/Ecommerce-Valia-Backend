import { supabase } from "../config/supabase.js";

export async function getAllProducts() {

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}


export async function createProduct(product) {

  const { data, error } = await supabase
    .from("products")
    .insert([product])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}