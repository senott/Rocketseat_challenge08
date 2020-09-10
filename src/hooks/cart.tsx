import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // AsyncStorage.clear();

      const cartProducts = await AsyncStorage.getItem('@GoMarktplace:products');

      if (cartProducts) {
        setProducts(JSON.parse(cartProducts));
      }
    }

    loadProducts();
  }, []);

  const createNewProduct = useCallback(
    async (newProduct: Product): Promise<void> => {
      const newProducts = products
        ? products.filter(item => item.id !== newProduct.id)
        : [];

      newProducts.push(newProduct);

      await AsyncStorage.setItem(
        '@GoMarktplace:products',
        JSON.stringify(newProducts),
      );

      setProducts(newProducts);
    },
    [products],
  );

  const removeProduct = useCallback(
    async id => {
      const newProducts = products.filter(item => item.id !== id);

      await AsyncStorage.setItem(
        '@GoMarktplace:products',
        JSON.stringify(newProducts),
      );

      setProducts(newProducts);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const existingProduct = products
        ? products.filter(item => product.id === item.id)
        : [];

      if (existingProduct.length > 0) {
        const newProduct: Product = {
          ...existingProduct[0],
          quantity: existingProduct[0].quantity += 1,
        };
        createNewProduct(newProduct);
      } else {
        const newProduct: Product = { ...product, quantity: 1 };
        createNewProduct(newProduct);
      }
    },
    [createNewProduct, products],
  );

  const increment = useCallback(
    async id => {
      const updatedProduct = products.filter(item => item.id === id);

      const newProduct: Product = {
        ...updatedProduct[0],
        quantity: updatedProduct[0].quantity += 1,
      };

      createNewProduct(newProduct);
    },
    [products, createNewProduct],
  );

  const decrement = useCallback(
    async id => {
      const updatedProduct = products.filter(item => item.id === id);

      const newProduct: Product = {
        ...updatedProduct[0],
        quantity: updatedProduct[0].quantity -= 1,
      };

      if (newProduct.quantity <= 0) {
        removeProduct(newProduct.id);
      } else {
        createNewProduct(newProduct);
      }
    },
    [products, createNewProduct, removeProduct],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
