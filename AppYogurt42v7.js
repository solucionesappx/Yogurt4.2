import React, { useState, useEffect, useMemo } from 'react';

// Importa los iconos de Lucide React para una mejor UI
import {
  LogIn, User, ShoppingCart, Home, List, PlusCircle, Edit, Save, XCircle, Key, LogOut, CheckCircle, Info, DollarSign, Package, Tag, Store, Lock, FileText, View
} from 'lucide-react';

// Importa la función para enviar datos al Google Apps Script
// ASEGÚRATE de que este archivo 'dataSender.js' esté en la MISMA CARPETA que App.js
import { sendDataToGoogleScript } from './dataSender'; 

// Datos mock para simular las hojas de Google Sheets
// NOTA: En una aplicación real, estos datos se obtendrían de un backend
// que interactuaría de forma segura con Google Sheets.
const mockClientes = [
  { Cliente_ID: 1001, Cliente_Clave: 'clave123', Cliente_Nombre: 'Juan Perez', Cliente_Status: 'Activo', Cliente_Perfil: 'Admin', Cliente_Correo: 'juan@example.com', Cliente_Telefono: '123-456-7890', Cliente_IDX: 'JP001' },
  { Cliente_ID: 1002, Cliente_Clave: 'pass456', Cliente_Nombre: 'Maria Lopez', Cliente_Status: 'Activo', Cliente_Perfil: 'Client', Cliente_Correo: 'maria@example.com', Cliente_Telefono: '098-765-4321', Cliente_IDX: 'ML002' },
  { Cliente_ID: 1003, Cliente_Clave: 'secure789', Cliente_Nombre: 'Pedro Gomez', Cliente_Status: 'Activo', Cliente_Perfil: 'Client', Cliente_Correo: 'pedro@example.com', Cliente_Telefono: '111-222-3333', Cliente_IDX: 'PG003' },
];

// Define tipos de productos base y sus costos
const baseProductTypes = [
  { name: 'Yogurt Batido', sizes: ['7 Oz', '23 Oz', '20 L'], baseCost: { '7 Oz': 2, '23 Oz': 5, '20 L': 35 }, moneda: 'USD', tienda: 'Tienda A' },
  { name: 'Yogurt Griego Natural', sizes: ['7 Oz', '23 Oz', '20 Kg'], baseCost: { '7 Oz': 3, '23 Oz': 7, '20 Kg': 40 }, moneda: 'USD', tienda: 'Tienda B' },
  { name: 'Yogurt Griego con Frutas', sizes: ['7 Oz', '23 Oz'], baseCost: { '7 Oz': 3.5, '23 Oz': 8 }, moneda: 'USD', tienda: 'Tienda A' },
  { name: 'Yogurt Líquido', sizes: ['900 ml'], baseCost: { '900 ml': 4 }, moneda: 'USD', tienda: 'Tienda B' },
];
// Define todos los sabores disponibles
const allFlavors = [
  'Fresa', 'Mora', 'Piña', 'Parchita', 'Ciruela', 'Guanábana', 'Durazno', 'Dulce', 'Natural', 'Otro'
];
// Función para generar el catálogo completo de productos con sus variantes
const generateProductCatalog = () => {
  let id = 101; // ID inicial para los productos del catálogo
  const catalog = [];
  baseProductTypes.forEach(productType => {
    productType.sizes.forEach(size => {
      // Determina los sabores aplicables para cada tipo de producto
      let applicableFlavors = allFlavors;
      if (productType.name === 'Yogurt Griego Natural') {
        applicableFlavors = ['Natural']; // El Yogurt Griego Natural solo tiene sabor 'Natural'
      }

      const sugarOptions = [true, false]; // true para 'C/Azúcar', false para 'S/Azúcar'

      sugarOptions.forEach(hasSugar => {
        applicableFlavors.forEach(flavor => {
          const description = `${productType.name} ${size}`;
          const presentation = `${hasSugar ? 'C/Azúcar' : 'S/Azúcar'}, Sabor: ${flavor}`;
          const cost = productType.baseCost[size]; // Obtiene el costo basado en el tamaño

          catalog.push({
            Plan_Cat_ID: id++,
            Plan_Cat_Descripción: description,
            Plan_Cat_Presentación: presentation,
            Plan_Cat_Costo: cost,
            Plan_Cat_Moneda: productType.moneda,
            Plan_Cat_Tienda: productType.tienda
          });
        });
      });
    });
  });
  return catalog;
};

const mockPlanesCat = generateProductCatalog(); // Genera el nuevo catálogo completo

// Simulamos los pedidos de los clientes. Cada pedido puede contener múltiples ítems.
// Estos serán considerados "finales" por defecto.
const mockPlanes = [
  { Order_ID: 'ORD001', Cliente_ID: 1001, Cliente_Nombre: 'Juan Perez', Order_Date: '2023-01-15', Status: 'Completado', isProvisional: false, Items: [{ Plan_Cat_ID: mockPlanesCat[0].Plan_Cat_ID, Quantity: 1, Position_ID: 10 }] },
  { Order_ID: 'ORD002', Cliente_ID: 1001, Cliente_Nombre: 'Juan Perez', Order_Date: '2023-02-20', Status: 'Completado', isProvisional: false, Items: [{ Plan_Cat_ID: mockPlanesCat[10].Plan_Cat_ID, Quantity: 1, Position_ID: 10 }, { Plan_Cat_ID: mockPlanesCat[25].Plan_Cat_ID, Quantity: 2, Position_ID: 20 }] },
  { Order_ID: 'ORD003', Cliente_ID: 1002, Cliente_Nombre: 'Maria Lopez', Order_Date: '2023-03-10', Status: 'Completado', isProvisional: false, Items: [{ Plan_Cat_ID: mockPlanesCat[50].Plan_Cat_ID, Quantity: 1, Position_ID: 10 }] },
];

// Componente de modal para mensajes
const MessageModal = ({ message, type, onClose }) => {
  if (!message) return null;

  let bgColor = 'bg-blue-500';
  let icon = <Info className="h-6 w-6" />;
  switch (type) {
    case 'success':
      bgColor = 'bg-green-500';
      icon = <CheckCircle className="h-6 w-6" />;
      break;
    case 'error':
      bgColor = 'bg-red-500';
      icon = <XCircle className="h-6 w-6" />;
      break;
    case 'info':
      bgColor = 'bg-blue-500';
      icon = <Info className="h-6 w-6" />;
      break;
    default:
      bgColor = 'bg-gray-500';
      break;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 font-inter">
      <div className={`rounded-lg shadow-xl p-6 ${bgColor} text-white max-w-sm w-full relative`}>
        <button onClick={onClose} className="absolute top-3 right-3 text-white hover:text-gray-200">
          <XCircle className="h-6 w-6" />
        </button>
        <div className="flex items-center mb-4">
          {icon}
          <span className="ml-3 text-lg font-semibold">Mensaje</span>
        </div>
        <p className="text-sm text-gray-100 mb-4">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-white text-gray-800 py-2 px-4 rounded-md hover:bg-gray-100 transition duration-300 shadow-md"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

// Nuevo componente de modal de confirmación
const ConfirmModal = ({ message, onConfirm, onCancel, show }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 font-inter">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full relative">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirmación</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-300 shadow-md"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 shadow-md"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};


// Componente de Login
const Login = ({ onLogin, setMessage }) => {
  const [nombre, setNombre] = useState('');
  const [clave, setClave] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = mockClientes.find(
      (c) => c.Cliente_Nombre === nombre && c.Cliente_Clave === clave && c.Cliente_Status === 'Activo'
    );
    if (user) {
      onLogin(user);
      setMessage('¡Bienvenido! Has iniciado sesión con éxito.', 'success');
    } else {
      setMessage('Nombre de usuario o clave incorrectos, o usuario inactivo.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="nombre">
              <User className="inline-block mr-2 h-4 w-4 text-indigo-500" />Nombre de Usuario
            </label>
            <input
              type="text"
              id="nombre"
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Ingresa tu nombre de usuario"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="clave">
              <Key className="inline-block mr-2 h-4 w-4 text-indigo-500" />Clave
            </label>
            <input
              type="password"
              id="clave"
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              placeholder="Ingresa tu clave"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-300 shadow-md transform hover:scale-105"
          >
            <LogIn className="inline-block mr-2 h-5 w-5" />Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
};

// Componente de Dashboard
const Dashboard = ({ loggedInUser, onLogout, setCurrentPage, setMessage }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-inter">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <ShoppingCart className="mr-3 h-7 w-7" />Sistema de Pedidos
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-lg font-medium">
              <User className="inline-block mr-2 h-5 w-5" />Hola, {loggedInUser.Cliente_Nombre}
            </span>
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 transform hover:scale-105 flex items-center"
            >
              <LogOut className="mr-2 h-5 w-5" />Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tarjeta de Catálogo de Productos */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setCurrentPage('catalog')}>
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4 mx-auto">
              <List className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">Catálogo de Productos</h3>
            <p className="text-gray-600 text-center text-sm">Explora los planes y servicios disponibles.</p>
            <div className="mt-4 text-center">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 shadow-md"
              >
                Ver Catálogo
              </button>
            </div>
          </div>

          {/* Tarjeta de Nuevo Pedido */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setCurrentPage('new-order')}>
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4 mx-auto">
              <PlusCircle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">Realizar Nuevo Pedido</h3>
            <p className="text-gray-600 text-center text-sm">Crea una nueva solicitud de producto.</p>
            <div className="mt-4 text-center">
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 shadow-md"
              >
                Hacer Pedido
              </button>
            </div>
          </div>

          {/* Tarjeta de Mis Pedidos */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setCurrentPage('my-orders')}>
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mb-4 mx-auto">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">Mis Pedidos</h3>
            <p className="text-gray-600 text-center text-sm">Visualiza y gestiona tus pedidos existentes.</p>
            <div className="mt-4 text-center">
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 shadow-md"
              >
                Ver Pedidos
              </button>
            </div>
          </div>

          {/* Tarjeta de Cambiar Contraseña */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setCurrentPage('change-password')}>
            <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full mb-4 mx-auto">
              <Key className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">Cambiar Clave</h3>
            <p className="text-gray-600 text-center text-sm">Actualiza tu clave de acceso.</p>
            <div className="mt-4 text-center">
              <button
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 shadow-md"
              >
                Cambiar Clave
              </button>
            </div>
          </div>

          {/* NUEVO: Tarjeta para la vista de Administrador (solo para Admin) */}
          {loggedInUser.Cliente_Perfil === 'Admin' && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setCurrentPage('admin-orders')}>
              <div className="flex items-center justify-center w-16 h-16 bg-teal-100 text-teal-600 rounded-full mb-4 mx-auto">
                <View className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">Consolidar Pedidos</h3>
              <p className="text-gray-600 text-center text-sm">Ver y gestionar todos los pedidos pendientes de entrega.</p>
              <div className="mt-4 text-center">
                <button
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 shadow-md"
                >
                  Ver Pedidos
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Componente de Catálogo de Productos
const ProductCatalog = ({ setCurrentPage }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 font-inter">
      <div className="container mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
            <List className="mr-3 h-7 w-7 text-blue-600" />Catálogo de Productos
          </h2>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-300 shadow-md flex items-center"
          >
            <Home className="mr-2 h-5 w-5" />Volver al Dashboard
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider rounded-tl-lg">
                  <Tag className="inline-block mr-1 h-4 w-4" />ID
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  <Info className="inline-block mr-1 h-4 w-4" />Descripción
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  <Package className="inline-block mr-1 h-4 w-4" />Presentación
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  <DollarSign className="inline-block mr-1 h-4 w-4" />Costo
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Moneda
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider rounded-tr-lg">
                  <Store className="inline-block mr-1 h-4 w-4" />Tienda
                </th>
              </tr>
            </thead>
            <tbody>
              {mockPlanesCat.map((product, index) => (
                <tr key={product.Plan_Cat_ID} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200 last:border-b-0`}>
                  <td className="py-3 px-4 text-sm text-gray-700">{product.Plan_Cat_ID}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{product.Plan_Cat_Descripción}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{product.Plan_Cat_Presentación}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{product.Plan_Cat_Costo}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{product.Plan_Cat_Moneda}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{product.Plan_Cat_Tienda}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Componente para realizar un nuevo pedido
const NewOrder = ({ loggedInUser, setCurrentPage, orders, setOrders, provisionalOrders, setProvisionalOrders, nextProvisionalOrderId, setNextProvisionalOrderId, setMessage, editingOrder = null, setEditingOrder }) => {
  const [selectedBaseProductDescription, setSelectedBaseProductDescription] = useState('');
  const [selectedHasSugar, setSelectedHasSugar] = useState(false); // Corresponds to C/Azúcar (true) / S/Azúcar (false)
  const [selectedFlavor, setSelectedFlavor] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState(1); // Renamed 'quantity' to 'quantityToAdd' for clarity
  const [cart, setCart] = useState([]); // This cart represents the items for the current order being built/edited

  // Constante para el ancho mínimo de la descripción del producto
  const MIN_PRODUCT_DESC_LENGTH = 33;

  // Función para rellenar una cadena con espacios hasta una longitud mínima
  const padString = (str, minLength) => {
    if (str.length >= minLength) {
      return str;
    }
    return str + ' '.repeat(minLength - str.length);
  };

  // Obtener descripciones de productos base únicas para el primer dropdown
  const uniqueBaseDescriptions = useMemo(() => {
    return [...new Set(mockPlanesCat.map(p => p.Plan_Cat_Descripción))];
  }, []);

  // Filtrar sabores disponibles basados en la descripción del producto base seleccionada
  const availableFlavorsForSelection = useMemo(() => {
    if (!selectedBaseProductDescription) return [];

    const relevantProducts = mockPlanesCat.filter(p =>
      p.Plan_Cat_Descripción === selectedBaseProductDescription
    );

    const flavors = new Set();
    relevantProducts.forEach(p => {
      // Extrae el sabor de la cadena de presentación (ej. "C/Azúcar, Sabor: Fresa" -> "Fresa")
      const match = p.Plan_Cat_Presentación.match(/Sabor: (.*)/);
      if (match && match[1]) {
        flavors.add(match[1]);
      }
    });
    return Array.from(flavors);
  }, [selectedBaseProductDescription]);


  useEffect(() => {
    if (editingOrder) {
      // If we are editing an order, pre-load the cart with order items
      const itemsWithDetails = editingOrder.Items.map(item => {
        const product = mockPlanesCat.find(p => p.Plan_Cat_ID === item.Plan_Cat_ID);
        return { ...item, ...product, Position_ID: item.Position_ID }; // Ensure Position_ID is carried over
      });
      setCart(itemsWithDetails);

      // Reset quantityToAdd when editing an order, as it's for adding new items
      setQuantityToAdd(1);
      // Attempt to pre-load selectors for the FIRST item if it's a single-item order being edited
      if (editingOrder.Items.length === 1 && itemsWithDetails[0]) {
        const firstItem = itemsWithDetails[0];
        setSelectedBaseProductDescription(firstItem.Plan_Cat_Descripción);
        setSelectedHasSugar(firstItem.Plan_Cat_Presentación.includes('C/Azúcar'));
        const flavorMatch = firstItem.Plan_Cat_Presentación.match(/Sabor: (.*)/);
        if (flavorMatch && flavorMatch[1]) {
          setSelectedFlavor(flavorMatch[1]);
        }
      } else {
        // For multi-item orders or if pre-loading fails, reset selectors
        setSelectedBaseProductDescription('');
        setSelectedHasSugar(false);
        setSelectedFlavor('');
      }

    } else {
      // Reset cart and selectors if not editing
      setCart([]);
      setSelectedBaseProductDescription('');
      setSelectedHasSugar(false);
      setSelectedFlavor('');
      setQuantityToAdd(1);
    }
  }, [editingOrder]);

  const handleAddProductToCart = () => {
    if (!selectedBaseProductDescription) {
      setMessage('Por favor, selecciona un tipo de producto (ej. Yogurt Batido 7 Oz).', 'error');
      return;
    }
    // For 'Yogurt Griego Natural', the flavor is always 'Natural'. No need for the user to select it.
    // If not 'Yogurt Griego Natural' and no flavor is selected, show error.
    if (selectedBaseProductDescription.includes('Yogurt Griego Natural')) {
      // Auto-select Natural if it's Greek Natural, but still require a selection if it was reset
      if (selectedFlavor === '') { // Only set if not already set by editing pre-load
         setSelectedFlavor('Natural');
      }
    } else if (!selectedFlavor) {
      setMessage('Por favor, selecciona un sabor para el producto.', 'error');
      return;
    }

    if (quantityToAdd <= 0) {
      setMessage('La cantidad a añadir debe ser mayor a 0.', 'error');
      return;
    }

    // Construir la cadena de presentación para la búsqueda exacta
    const currentFlavor = selectedBaseProductDescription.includes('Yogurt Griego Natural') ? 'Natural' : selectedFlavor;
    const targetPresentation = `${selectedHasSugar ? 'C/Azúcar' : 'S/Azúcar'}, Sabor: ${currentFlavor}`;

    // Encontrar la variante exacta del producto en el catálogo
    const productToAdd = mockPlanesCat.find(p =>
      p.Plan_Cat_Descripción === selectedBaseProductDescription &&
      p.Plan_Cat_Presentación === targetPresentation
    );

    if (!productToAdd) {
      setMessage('Combinación de producto, azúcar y sabor no encontrada. Por favor, verifica tu selección.', 'error');
      return;
    }

    // Check if the product is already in the cart (by Plan_Cat_ID)
    const existingItemIndex = cart.findIndex(item => item.Plan_Cat_ID === productToAdd.Plan_Cat_ID);

    if (existingItemIndex > -1) {
      // If the product is already there, update the quantity
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].Quantity += quantityToAdd;
      setCart(updatedCart);
      setMessage(`Cantidad de "${productToAdd.Plan_Cat_Descripción} - ${productToAdd.Plan_Cat_Presentación}" actualizada en el carrito.`, 'info');
    } else {
      // If not, add it with a new Position_ID
      const newPositionId = cart.length > 0 ? Math.max(...cart.map(item => item.Position_ID)) + 10 : 10;
      setCart([...cart, { ...productToAdd, Quantity: quantityToAdd, Position_ID: newPositionId }]);
      setMessage(`"${productToAdd.Plan_Cat_Descripción} - ${productToAdd.Plan_Cat_Presentación}" agregado al carrito.`, 'success');
    }

    // Reset selection after adding to cart
    setSelectedBaseProductDescription('');
    setSelectedHasSugar(false);
    setSelectedFlavor('');
    setQuantityToAdd(1); // Reset quantity to add to 1
  };

  const handleRemoveItemFromCart = (productIdToRemove) => {
    setCart(cart.filter(item => item.Plan_Cat_ID !== productIdToRemove));
    setMessage('Producto eliminado del carrito.', 'info');
  };

  // NEW: Functions to update quantity of items already in the cart
  const handleUpdateCartItemQuantity = (productId, delta) => {
    setCart(prevCart => {
      const updatedCart = prevCart.map(item => {
        if (item.Plan_Cat_ID === productId) {
          const newQuantity = item.Quantity + delta;
          if (newQuantity <= 0) {
            // Remove item if quantity goes to 0 or less
            setMessage(`"${item.Plan_Cat_Descripción} - ${item.Plan_Cat_Presentación}" eliminado del carrito.`, 'info');
            return null; // Mark for removal
          }
          setMessage(`Cantidad de "${item.Plan_Cat_Descripción} - ${item.Plan_Cat_Presentación}" modificada.`, 'info');
          return { ...item, Quantity: newQuantity };
        }
        return item;
      }).filter(item => item !== null); // Filter out marked items
      return updatedCart;
    });
  };

  // NEW: Functions to handle increment/decrement for 'quantityToAdd'
  const handleIncrementQuantityToAdd = () => {
    setQuantityToAdd(prev => prev + 1);
  };

  const handleDecrementQuantityToAdd = () => {
    setQuantityToAdd(prev => (prev > 1 ? prev - 1 : 1)); // Don't go below 1
  };


  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      setMessage('El carrito está vacío. Por favor, agrega productos antes de realizar un pedido.', 'error');
      return;
    }

    const itemsForOrder = cart.map(item => ({ Plan_Cat_ID: item.Plan_Cat_ID, Quantity: item.Quantity, Position_ID: item.Position_ID }));

    if (editingOrder) {
      // Logic for updating an existing order
      if (editingOrder.isProvisional) {
        // Update provisional order
        setProvisionalOrders(prevProvisionalOrders => prevProvisionalOrders.map(order =>
          order.Provisional_Order_ID === editingOrder.Provisional_Order_ID
            ? {
                ...order,
                Items: itemsForOrder,
                Order_Date: new Date().toISOString().split('T')[0],
              }
            : order
        ));
        setMessage('¡Pedido provisional modificado con éxito!', 'success');
      } else {
        // Update final order (though usually not editable once final, but user can click edit)
        // If a "final" order is edited, it means its items are changed, but it remains "final".
        setOrders(prevOrders => prevOrders.map(order =>
          order.Order_ID === editingOrder.Order_ID
            ? {
                ...order,
                Items: itemsForOrder,
                Order_Date: new Date().toISOString().split('T')[0],
              }
            : order
        ));
        setMessage('¡Pedido final modificado con éxito!', 'success');
      }
      setEditingOrder(null); // Clear the editing order state
    } else {
      // Create a new provisional order with the requested ID format
      const newProvisionalOrder = {
        Order_ID: `${nextProvisionalOrderId}P`, // Correlativo: 490001P
        Provisional_Order_ID: nextProvisionalOrderId, // Numeric ID for internal use
        Cliente_ID: loggedInUser.Cliente_ID,
        Cliente_Nombre: loggedInUser.Cliente_Nombre,
        Order_Date: new Date().toISOString().split('T')[0],
        Status: 'Pendiente Provisional',
        isProvisional: true, // Mark as provisional
        Items: itemsForOrder,
      };
      setProvisionalOrders(prevProvisionalOrders => [...prevProvisionalOrders, newProvisionalOrder]);
      setNextProvisionalOrderId(nextProvisionalOrderId + 1); // Increment for next provisional order
      setMessage('¡Pedido provisional realizado con éxito!', 'success');
    }

    setCart([]); // Clear cart after placing/modifying order
    setCurrentPage('my-orders'); // Navigate to my orders page
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-inter">
      <div className="container mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center justify-between mb-8">
          {/* Modified heading size */}
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            {editingOrder ? <Edit className="mr-3 h-7 w-7 text-purple-600" /> : <PlusCircle className="mr-3 h-7 w-7 text-green-600" />}
            {editingOrder ? `Modificar Pedido ${editingOrder.isProvisional ? '#' + editingOrder.Provisional_Order_ID : editingOrder.Order_ID}` : 'Realizar Nuevo Pedido'}
          </h3>
          <button
            onClick={() => { setCurrentPage('dashboard'); setEditingOrder(null); }}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-300 shadow-md flex items-center"
          >
            <Home className="mr-2 h-5 w-5" />Volver al Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sección de Agregar Productos */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><PlusCircle className="mr-2" /> Agregar Productos al Pedido</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="base-product-select" className="block text-gray-700 text-sm font-semibold mb-2">Tipo de Producto:</label>
                <select
                  id="base-product-select"
                  className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-200"
                  value={selectedBaseProductDescription}
                  onChange={(e) => {
                    setSelectedBaseProductDescription(e.target.value);
                    setSelectedFlavor(''); // Reset flavor when base product changes
                  }}
                >
                  <option value="">Selecciona un tipo de producto</option>
                  {uniqueBaseDescriptions.map((desc, index) => (
                    <option key={index} value={desc}>
                      {desc}
                    </option>
                  ))}
                </select>
              </div>

              {selectedBaseProductDescription && (
                <>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="has-sugar"
                      className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      checked={selectedHasSugar}
                      onChange={(e) => setSelectedHasSugar(e.target.checked)}
                    />
                    <label htmlFor="has-sugar" className="ml-2 text-gray-700 text-sm font-semibold">Con Azúcar</label>
                  </div>

                  {selectedBaseProductDescription && !selectedBaseProductDescription.includes('Yogurt Griego Natural') && (
                    <div>
                      <label htmlFor="flavor-select" className="block text-gray-700 text-sm font-semibold mb-2">Sabor:</label>
                      <select
                        id="flavor-select"
                        className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-200"
                        value={selectedFlavor}
                        onChange={(e) => setSelectedFlavor(e.target.value)}
                      >
                        <option value="">Selecciona un sabor</option>
                        {availableFlavorsForSelection.map((flavor, index) => (
                          <option key={index} value={flavor}>
                            {flavor}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedBaseProductDescription.includes('Yogurt Griego Natural') && (
                    <div className="text-gray-600 text-sm">
                      <p className="block text-gray-700 text-sm font-semibold mb-2">Sabor:</p>
                      <span className="bg-gray-100 py-2 px-3 rounded-md border border-gray-200 block">Natural (Automático para Yogurt Griego Natural)</span>
                    </div>
                  )}
                </>
              )}

              {/* NEW: Reemplazar input de cantidad con botones + y - */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Cantidad a Añadir:</label>
                <div className="flex items-center justify-between border rounded-lg overflow-hidden shadow-sm">
                  <button
                    onClick={handleDecrementQuantityToAdd}
                    className="p-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold transition duration-200 flex-grow-0 rounded-l-lg"
                    disabled={quantityToAdd <= 1}
                  >
                    -
                  </button>
                  <span className="flex-grow text-center py-3 px-4 text-gray-700 font-semibold bg-white">
                    {quantityToAdd}
                  </span>
                  <button
                    onClick={handleIncrementQuantityToAdd}
                    className="p-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold transition duration-200 flex-grow-0 rounded-r-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddProductToCart}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md transform hover:scale-105 flex items-center justify-center"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />Añadir al Carrito
              </button>
            </div>
          </div>

          {/* Sección del Carrito/Resumen del Pedido */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><ShoppingCart className="mr-2" /> Carrito de Pedido</h3>
            {cart.length === 0 ? (
              <p className="text-gray-600 italic">El carrito está vacío.</p>
            ) : (
              <div className="space-y-0.5 w-full">
                {cart.map((item) => {
                  const productDescriptionPart = item.Plan_Cat_Presentación.split(',')[0] || '';
                  const fullFlavorPart = item.Plan_Cat_Presentación.split(',')[1]?.trim() || '';
                  // Extracción correcta del sabor sin la palabra "Sabor: "
                  const productFlavorDisplay = fullFlavorPart.startsWith('Sabor: ') ? fullFlavorPart.substring('Sabor: '.length) : fullFlavorPart;

                  return (
                    <div key={item.Plan_Cat_ID} className="flex items-center bg-gray-100 py-0.5 px-3 rounded-md border border-gray-200 shadow-sm text-sm justify-between">
                      <span className="w-10 font-bold text-gray-700 shrink-0">{item.Position_ID}:</span> {/* Adjusted width */}
                      <div className="flex-grow min-w-0 pr-2"> {/* Increased flex-grow by reducing other fixed widths */}
                        <p className="leading-tight">{padString(item.Plan_Cat_Descripción, MIN_PRODUCT_DESC_LENGTH)} - {productDescriptionPart}</p>
                        <p className="text-gray-600 text-xs leading-tight">{productFlavorDisplay ? `Sabor: ${productFlavorDisplay}` : ''}</p>
                      </div>
                      {/* NEW: Botones de incremento/decremento en el carrito */}
                      <div className="flex items-center space-x-1 mr-4">
                        <button
                          onClick={() => handleUpdateCartItemQuantity(item.Plan_Cat_ID, -1)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 p-1 rounded-full text-xs font-bold w-6 h-6 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="text-gray-700 font-semibold">{item.Quantity}</span>
                        <button
                          onClick={() => handleUpdateCartItemQuantity(item.Plan_Cat_ID, 1)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 p-1 rounded-full text-xs font-bold w-6 h-6 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <span className="w-24 text-right font-medium text-gray-800 shrink-0 pr-2">
                        {(item.Plan_Cat_Costo * item.Quantity).toFixed(2)} {item.Plan_Cat_Moneda}
                      </span>
                      <button
                        onClick={() => handleRemoveItemFromCart(item.Plan_Cat_ID)}
                        className="text-red-500 hover:text-red-700 transition duration-200 ml-auto shrink-0"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
                <div className="border-t border-gray-300 pt-4 mt-4">
                  <p className="text-lg font-bold text-right text-gray-800">
                    Total: {cart.reduce((sum, item) => sum + (item.Plan_Cat_Costo * item.Quantity), 0).toFixed(2)} USD
                  </p>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md transform hover:scale-105 flex items-center justify-center"
                >
                  {editingOrder ? <Save className="mr-2 h-5 w-5" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                  {editingOrder ? 'Guardar Cambios del Pedido' : 'Confirmar Pedido'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para visualizar y modificar pedidos
const MyOrders = ({ loggedInUser, setCurrentPage, orders, setOrders, provisionalOrders, setProvisionalOrders, setMessage, setEditingOrder, setShowConfirmModal, setConfirmModalMessage, setConfirmModalOnConfirm, setConfirmModalOnCancel }) => {
  const allOrders = useMemo(() => {
    // Combine provisional and final orders for the current user
    const userProvisionalOrders = provisionalOrders
      .filter(order => order.Cliente_ID === loggedInUser.Cliente_ID)
      .map(order => ({ ...order, displayId: `#${order.Provisional_Order_ID} (Provisional)` }));

    const userFinalOrders = orders
      .filter(order => order.Cliente_ID === loggedInUser.Cliente_ID)
      .map(order => ({ ...order, displayId: order.Order_ID }));

    return [...userProvisionalOrders, ...userFinalOrders];
  }, [orders, provisionalOrders, loggedInUser.Cliente_ID]);

  // Función para calcular el total de un pedido
  const calculateOrderTotal = (order) => {
    return order.Items.reduce((total, item) => {
      const product = mockPlanesCat.find(p => p.Plan_Cat_ID === item.Plan_Cat_ID);
      return total + (product ? product.Plan_Cat_Costo * item.Quantity : 0);
    }, 0);
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order); // Set the order to be edited
    setCurrentPage('new-order'); // Navigate to the NewOrder page
  };

  const handleDeleteOrder = (orderToDelete) => {
    setConfirmModalMessage(`¿Estás seguro de que quieres eliminar el pedido ${orderToDelete.displayId}? Esta acción no se puede deshacer.`);
    setConfirmModalOnConfirm(() => {
      if (orderToDelete.isProvisional) {
        setProvisionalOrders(prev => prev.filter(order => order.Provisional_Order_ID !== orderToDelete.Provisional_Order_ID));
        setMessage(`Pedido provisional ${orderToDelete.displayId} eliminado.`, 'success');
      } else {
        // En una aplicación real, enviarías esto al backend para eliminar el pedido final.
        // Por ahora, solo lo eliminamos del mock.
        setOrders(prev => prev.filter(order => order.Order_ID !== orderToDelete.Order_ID));
        setMessage(`Pedido final ${orderToDelete.displayId} eliminado.`, 'success');
      }
      setShowConfirmModal(false);
    });
    setConfirmModalOnCancel(() => () => { // Definir una acción de cancelación vacía o específica
      setMessage('Operación cancelada.', 'info');
      setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };

  const handleConfirmProvisionalOrder = (orderToConfirm) => {
    setConfirmModalMessage(`¿Estás seguro de que quieres confirmar el pedido provisional ${orderToConfirm.displayId}? Se convertirá en un pedido final.`);
    setConfirmModalOnConfirm(() => {
      // Find the current highest Order_ID and increment for the new final order
      const maxOrderIdNum = orders.reduce((max, o) => {
        const num = parseInt(o.Order_ID.replace('ORD', ''), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const newOrderIdNum = maxOrderIdNum + 1;
      const newOrderId = `ORD${String(newOrderIdNum).padStart(3, '0')}`;

      const finalOrder = {
        ...orderToConfirm,
        Order_ID: newOrderId,
        Status: 'Completado', // O 'Pendiente de Entrega' si hay un paso intermedio
        isProvisional: false,
        displayId: newOrderId,
        Order_Date: new Date().toISOString().split('T')[0], // Actualizar fecha de confirmación
      };

      setOrders(prevOrders => [...prevOrders, finalOrder]);
      setProvisionalOrders(prevProvisionalOrders => prevProvisionalOrders.filter(order => order.Provisional_Order_ID !== orderToConfirm.Provisional_Order_ID));
      setMessage(`Pedido provisional ${orderToConfirm.displayId} confirmado como ${finalOrder.displayId}.`, 'success');
      setShowConfirmModal(false);
    });
    setConfirmModalOnCancel(() => () => { // Definir una acción de cancelación vacía o específica
      setMessage('Operación cancelada.', 'info');
      setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };

  // NUEVA FUNCIÓN handleExportToPdf - INTEGRACIÓN CON GOOGLE APPS SCRIPT
  const handleExportToPdf = async (order) => {
    setMessage('Generando PDF y registrando datos, por favor espera...', 'info');
    try {
      // Preparar los datos del pedido según la estructura solicitada
      // para OrdenesCab, OrdenesDet y Clientes
      const clienteInfo = mockClientes.find(c => c.Cliente_ID === order.Cliente_ID) || {};

      const orderDataForGAS = {
        action: 'generatePdfAndSaveOrder', // Una nueva acción para el Apps Script
        // Datos para OrdenesCab
        Orden_ID: order.Order_ID,
        Cliente_ID: order.Cliente_ID,
        Cliente_Nombre: order.Cliente_Nombre,
        Orden_Fecha: order.Order_Date,
        Orden_Status: order.Status,
        // Asumiendo que estos campos pueden venir o ser nullish
        Orden_Fecha_Despacho: order.Order_Date_Disp || '', 
        Orden_Fecha_Ult_Mod: order.Last_Mod_Date || '',

        // Datos para OrdenesDet
        Items: order.Items.map(item => {
          const productDetails = mockPlanesCat.find(p => p.Plan_Cat_ID === item.Plan_Cat_ID);
          return {
            Orden_ID: order.Order_ID, // Asegura que el ID de la orden esté en cada item
            Orden_Fecha: order.Order_Date, // Asegura la fecha en cada item
            Orden_Pos: item.Position_ID,
            Orden_Producto: productDetails?.Plan_Cat_Descripción || 'Producto Desconocido',
            Orden_Cantidad: item.Quantity,
            Orden_Subtotal: (productDetails?.Plan_Cat_Costo * item.Quantity).toFixed(2), // Calcular subtotal
            Orden_Total: calculateOrderTotal(order).toFixed(2), // Total del pedido, repetido por item si es necesario en cada línea de detalle
            Plan_Cat_Presentación: productDetails?.Plan_Cat_Presentación || '', // Información adicional para el PDF
            Plan_Cat_Costo_Unitario: productDetails?.Plan_Cat_Costo || 0, // Costo unitario para PDF
            Plan_Cat_Moneda: productDetails?.Plan_Cat_Moneda || 'USD'
          };
        }),

        // Datos para Clientes (siempre asociados al pedido)
        Cliente_Correo: clienteInfo.Cliente_Correo || '',
        Cliente_Telefono: clienteInfo.Cliente_Telefono || '',
        Cliente_IDX: clienteInfo.Cliente_IDX || '',
        Cliente_Clave: clienteInfo.Cliente_Clave || '' // Cuidado con exponer claves, si es solo para registro interno, OK.
      };

      // Realiza la llamada al Google Apps Script
      const response = await sendDataToGoogleScript(orderDataForGAS);

      if (response.success) {
        setMessage(`PDF generado y datos registrados en Google Sheet. ${response.fileUrl ? 'Puedes verlo aquí: ' + response.fileUrl : ''}`, 'success');
        if (response.fileUrl) {
          window.open(response.fileUrl, '_blank'); // Abre el PDF en una nueva pestaña
        }
      } else {
        setMessage(`Error al generar el PDF o registrar datos: ${response.error || 'Mensaje desconocido'}`, 'error');
      }
    } catch (error) {
      console.error('Error al exportar PDF (frontend):', error);
      setMessage(`Error de conexión al generar el PDF: ${error.message}`, 'error');
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-4 font-inter">
      <div className="container mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
            <ShoppingCart className="mr-3 h-7 w-7 text-purple-600" />Mis Pedidos
          </h2>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-300 shadow-md flex items-center"
          >
            <Home className="mr-2 h-5 w-5" />Volver al Dashboard
          </button>
        </div>

        {allOrders.length === 0 ? (
          <p className="text-gray-600 italic">No tienes pedidos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider rounded-tl-lg">ID Pedido</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Fecha</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Ítems</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider rounded-tr-lg">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {allOrders.map((order, index) => (
                  <tr key={order.Order_ID || order.Provisional_Order_ID} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200 last:border-b-0`}>
                    <td className="py-3 px-4 text-sm text-gray-700">{order.displayId}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{order.Order_Date}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${order.Status === 'Completado' ? 'bg-green-100 text-green-800' :
                          order.Status === 'Pendiente Provisional' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'}`}>
                        {order.Status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{calculateOrderTotal(order).toFixed(2)} USD</td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      <ul className="list-disc list-inside text-xs">
                        {order.Items.map(item => {
                          const product = mockPlanesCat.find(p => p.Plan_Cat_ID === item.Plan_Cat_ID);
                          return (
                            <li key={item.Position_ID}>
                              {item.Quantity}x {product?.Plan_Cat_Descripción} ({product?.Plan_Cat_Presentación})
                            </li>
                          );
                        })}
                      </ul>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      <div className="flex space-x-2">
                        {order.isProvisional && (
                          <>
                            <button
                              onClick={() => handleConfirmProvisionalOrder(order)}
                              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition duration-300 shadow-md text-sm flex items-center"
                              title="Confirmar Pedido Provisional"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />Confirmar
                            </button>
                            <button
                              onClick={() => handleEditOrder(order)}
                              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition duration-300 shadow-md text-sm flex items-center"
                              title="Editar Pedido Provisional"
                            >
                              <Edit className="h-4 w-4 mr-1" />Editar
                            </button>
                          </>
                        )}
                        {loggedInUser.Cliente_Perfil === 'Admin' && !order.isProvisional && (
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition duration-300 shadow-md text-sm flex items-center"
                            title="Editar Pedido (Solo Admin)"
                          >
                            <Edit className="h-4 w-4 mr-1" />Editar
                          </button>
                        )}
                        {/* Botón de Exportar PDF (solo para pedidos Completados o Finalizados) */}
                        {(!order.isProvisional && (order.Status === 'Completado' || order.Status === 'Finalizado' || order.Status === 'Entregado' || order.Status === 'Generado')) && (
                          <button
                            onClick={() => handleExportToPdf(order)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition duration-300 shadow-md text-sm flex items-center"
                            title="Exportar Pedido a PDF"
                          >
                            <FileText className="h-4 w-4 mr-1" />PDF
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteOrder(order)}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-800 p-2 rounded-lg transition duration-300 shadow-md text-sm flex items-center"
                          title="Eliminar Pedido"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


// Componente para cambiar la clave
const ChangePassword = ({ loggedInUser, setLoggedInUser, setCurrentPage, setMessage }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleChangePassword = (e) => {
    e.preventDefault();

    if (oldPassword !== loggedInUser.Cliente_Clave) {
      setMessage('La clave actual es incorrecta.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('La nueva clave debe tener al menos 6 caracteres.', 'error');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setMessage('La nueva clave y la confirmación no coinciden.', 'error');
      return;
    }

    // Simulamos la actualización de la clave en los datos mock
    // En una aplicación real, esto se enviaría al backend.
    const updatedClientes = mockClientes.map(c =>
      c.Cliente_ID === loggedInUser.Cliente_ID
        ? { ...c, Cliente_Clave: newPassword }
        : c
    );
    // Nota: Aquí solo actualizamos el mockClientes localmente.
    // Si 'clientes' fuera un estado pasado como prop, se actualizaría.
    // Para esta demo, el cambio es solo visual para el usuario loggeado.
    setLoggedInUser({ ...loggedInUser, Cliente_Clave: newPassword }); // Actualiza la clave en el usuario loggeado
    setMessage('¡Clave cambiada con éxito!', 'success');
    setCurrentPage('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-inter">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 flex items-center justify-center">
          <Key className="mr-3 h-7 w-7 text-yellow-600" />Cambiar Clave
        </h2>
        <form onSubmit={handleChangePassword} className="max-w-md mx-auto space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="oldPassword">
              Clave Actual
            </label>
            <input
              type="password"
              id="oldPassword"
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-200"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="newPassword">
              Nueva Clave
            </label>
            <input
              type="password"
              id="newPassword"
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-200"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="confirmNewPassword">
              Confirmar Nueva Clave
            </label>
            <input
              type="password"
              id="confirmNewPassword"
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-200"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md transform hover:scale-105 flex items-center justify-center"
          >
            <Save className="mr-2 h-5 w-5" />Cambiar Clave
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage('dashboard')}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-lg transition duration-300 shadow-md flex items-center justify-center mt-4"
          >
            <Home className="mr-2 h-5 w-5" />Cancelar y Volver al Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

// Componente AdminOrdersView (anteriormente AdminOrders)
const AdminOrdersView = ({ loggedInUser, setCurrentPage, orders, setOrders, setMessage, consolidatedOrders, setConsolidatedOrders, nextConsolidatedOrderId, setNextConsolidatedOrderId, provisionalOrders }) => {
  // Estado para las IDs de los pedidos seleccionados para consolidar
  const [selectedOrderIds, setSelectedOrderIds] = useState({});

  // Constante para el ancho mínimo de la descripción del producto
  const MIN_PRODUCT_DESC_LENGTH = 33;

  // Función para rellenar una cadena con espacios hasta una longitud mínima
  const padString = (str, minLength) => {
    if (str.length >= minLength) {
      return str;
    }
    return str + ' '.repeat(minLength - str.length);
  };


  // Filtrar solo pedidos finales que NO han sido entregados y NO consolidados
  const pendingFinalOrders = orders.filter(order =>
    !order.isProvisional && order.Status !== 'Entregado' && order.Status !== 'Consolidado'
  );

  // Función para filtrar pedidos provisionales pendientes para la vista de administrador
  const pendingProvisionalOrders = provisionalOrders.filter(order => order.Status === 'Pendiente Provisional');

  // Función para obtener detalles de productos por ID (reutilizada de MyOrders)
  const getProductDetails = (productId) => {
    return mockPlanesCat.find(p => p.Plan_Cat_ID === productId);
  };

  // Función para manejar la selección de pedidos
  const handleSelectOrder = (orderId, isChecked) => {
    setSelectedOrderIds(prev => ({
      ...prev,
      [orderId]: isChecked
    }));
  };

  // Función para consolidar pedidos seleccionados
  const handleConsolidateOrders = () => {
    const ordersToConsolidate = orders.filter(order => selectedOrderIds[order.Order_ID]);

    if (ordersToConsolidate.length === 0) {
      setMessage('Por favor, selecciona al menos un pedido para consolidar.', 'error');
      return;
    }

    let newConsolidatedItems = [];
    // Recopilar todos los ítems de los pedidos seleccionados y ordenarlos por los criterios definidos
    let itemsToProcess = [];
    ordersToConsolidate.forEach(order => {
        order.Items.forEach(item => {
            const productDetails = getProductDetails(item.Plan_Cat_ID);
            itemsToProcess.push({
                ...productDetails,
                Quantity: item.Quantity,
                Original_Order_ID: order.Order_ID,
                Original_Order_Position_ID: item.Position_ID,
                Original_Cliente_Nombre: order.Cliente_Nombre
            });
        });
    });

    // Criterios de ordenamiento:
    // 1. Descripción del Producto
    // 2. Sabor
    // 3. ID del Pedido Original
    // 4. Posición en el Pedido Original
    itemsToProcess.sort((a, b) => {
        // Criterio 1: Descripción del Producto
        if (a.Plan_Cat_Descripción < b.Plan_Cat_Descripción) return -1;
        if (a.Plan_Cat_Descripción > b.Plan_Cat_Descripción) return 1;

        // Criterio 2: Sabor (extraído de Plan_Cat_Presentación)
        const flavorA = a.Plan_Cat_Presentación.split(',').find(part => part.includes('Sabor:'))?.trim() || '';
        const flavorB = b.Plan_Cat_Presentación.split(',').find(part => part.includes('Sabor:'))?.trim() || '';
        if (flavorA < flavorB) return -1;
        if (flavorA > flavorB) return 1;

        // Criterio 3: ID del Pedido Original (usar un valor numérico para ordenar correctamente)
        const orderIdNumA = parseInt(a.Original_Order_ID.replace('ORD', '') || '0');
        const orderIdNumB = parseInt(b.Original_Order_ID.replace('ORD', '') || '0');
        if (orderIdNumA < orderIdNumB) return -1;
        if (orderIdNumA > orderIdNumB) return 1;

        // Criterio 4: Posición en el Pedido Original
        return a.Original_Order_Position_ID - b.Original_Order_Position_ID;
    });

    // Asignar el nuevo correlativo de posición (10, 20, 30...) después de ordenar
    let currentConsolidatedPosition = 10;
    newConsolidatedItems = itemsToProcess.map(item => {
        const itemWithNewPosition = { ...item, Position_ID: currentConsolidatedPosition };
        currentConsolidatedPosition += 10;
        return itemWithNewPosition;
    });

    const newConsolidatedOrder = {
      Order_ID: `Consolidado-${String(nextConsolidatedOrderId).padStart(3, '0')}`,
      Cliente_ID: loggedInUser.Cliente_ID, // El admin es el "cliente" de este pedido consolidado
      Cliente_Nombre: loggedInUser.Cliente_Nombre,
      Order_Date: new Date().toISOString().split('T')[0],
      Status: 'Generado', // Nuevo estado para pedidos consolidados, ahora 'Generado'
      isProvisional: false, // Es un pedido "final" en su propia categoría
      Items: newConsolidatedItems,
      isConsolidated: true // Marcador para identificar fácilmente los pedidos consolidados
    };

    setConsolidatedOrders(prev => [...prev, newConsolidatedOrder]);
    setNextConsolidatedOrderId(prev => prev + 1);

    // Actualizar el estado de los pedidos originales a 'Consolidado'
    setOrders(prevOrders => prevOrders.map(order =>
      selectedOrderIds[order.Order_ID]
        ? { ...order, Status: 'Consolidado' }
        : order
    ));

    setSelectedOrderIds({}); // Limpiar selecciones
    setMessage('Pedidos consolidados con éxito.', 'success');
  };

  // handleExportToPdf function (reutilizada de MyOrders)
  const handleExportToPdf = async (order) => {
    setMessage('Generando PDF y registrando datos, por favor espera...', 'info');
    try {
      const clienteInfo = mockClientes.find(c => c.Cliente_ID === order.Cliente_ID) || {};

      const orderDataForGAS = {
        action: 'generatePdfAndSaveOrder', // Misma acción, Apps Script manejará consolidado vs individual
        // Datos para OrdenesCab
        Orden_ID: order.Order_ID,
        Cliente_ID: order.Cliente_ID,
        Cliente_Nombre: order.Cliente_Nombre,
        Orden_Fecha: order.Order_Date,
        Orden_Status: order.Status,
        Orden_Fecha_Despacho: order.Order_Date_Disp || '', 
        Orden_Fecha_Ult_Mod: order.Last_Mod_Date || '',
        isConsolidated: order.isConsolidated || false, // Pasar si es un pedido consolidado

        // Datos para OrdenesDet
        Items: order.Items.map(item => {
          const productDetails = getProductDetails(item.Plan_Cat_ID);
          return {
            Orden_ID: order.Order_ID, 
            Orden_Fecha: order.Order_Date, 
            Orden_Pos: item.Position_ID,
            Orden_Producto: productDetails?.Plan_Cat_Descripción || 'Producto Desconocido',
            Orden_Cantidad: item.Quantity,
            Orden_Subtotal: (productDetails?.Plan_Cat_Costo * item.Quantity).toFixed(2), 
            Orden_Total: (order.isConsolidated ? order.Items.reduce((sum, i) => sum + (getProductDetails(i.Plan_Cat_ID)?.Plan_Cat_Costo * i.Quantity), 0) : getProductDetails(item.Plan_Cat_ID)?.Plan_Cat_Costo * item.Quantity).toFixed(2), // Total del pedido o item
            Plan_Cat_Presentación: productDetails?.Plan_Cat_Presentación || '', 
            Plan_Cat_Costo_Unitario: productDetails?.Plan_Cat_Costo || 0, 
            Plan_Cat_Moneda: productDetails?.Plan_Cat_Moneda || 'USD',
            // Campos adicionales para pedidos consolidados
            Original_Order_ID: item.Original_Order_ID || '',
            Original_Order_Position_ID: item.Original_Order_Position_ID || '',
            Original_Cliente_Nombre: item.Original_Cliente_Nombre || ''
          };
        }),

        // Datos para Clientes
        Cliente_Correo: clienteInfo.Cliente_Correo || '',
        Cliente_Telefono: clienteInfo.Cliente_Telefono || '',
        Cliente_IDX: clienteInfo.Cliente_IDX || '',
        Cliente_Clave: clienteInfo.Cliente_Clave || '' 
      };

      const response = await sendDataToGoogleScript(orderDataForGAS);

      if (response.success) {
        setMessage(`PDF generado y datos registrados en Google Sheet. ${response.fileUrl ? 'Puedes verlo aquí: ' + response.fileUrl : ''}`, 'success');
        if (response.fileUrl) {
          window.open(response.fileUrl, '_blank');
        }
      } else {
        setMessage(`Error al generar el PDF o registrar datos: ${response.error || 'Mensaje desconocido'}`, 'error');
      }
    } catch (error) {
      console.error('Error al exportar PDF (frontend):', error);
      setMessage(`Error de conexión al generar el PDF: ${error.message}`, 'error');
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-4 font-inter">
      <div className="container mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
            <View className="mr-3 h-7 w-7 text-teal-600" />Consolidar Pedidos (Admin)
          </h2>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-300 shadow-md flex items-center"
          >
            <Home className="mr-2 h-5 w-5" />Volver al Dashboard
          </button>
        </div>

        <h3 className="text-2xl font-bold text-gray-800 mb-6">Pedidos Finales Pendientes de Consolidación</h3>
        {pendingFinalOrders.length === 0 ? (
          <p className="text-center text-gray-600 text-lg">No hay pedidos finales pendientes de consolidación.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 mb-8">
              {pendingFinalOrders.map((order) => (
                <div key={order.Order_ID} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-200">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-teal-600 rounded focus:ring-teal-500 mr-3"
                        checked={!!selectedOrderIds[order.Order_ID]}
                        onChange={(e) => handleSelectOrder(order.Order_ID, e.target.checked)}
                      />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">Pedido #{order.Order_ID}</h3>
                        <p className="text-sm text-gray-600">Cliente: {order.Cliente_Nombre}</p>
                        <p className="text-sm text-gray-600">Fecha: {order.Order_Date}</p>
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mt-2 ${
                          order.Status === 'Completado' ? 'bg-green-100 text-green-800' :
                          order.Status === 'Finalizado' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.Status}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {/* Botón de Exportar PDF para pedidos individuales pendientes */}
                      <button
                        onClick={() => handleExportToPdf(order)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition duration-300 shadow-md text-sm flex items-center"
                        title="Exportar Pedido a PDF"
                      >
                        <FileText className="h-4 w-4 mr-1" />PDF
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Detalles del Pedido:</h4>
                    <ul className="space-y-0.5 w-full"> 
                      {order.Items.map((item, itemIndex) => {
                        const product = getProductDetails(item.Plan_Cat_ID);
                        const productDescriptionPart = product ? (product.Plan_Cat_Presentación.split(',')[0] || '') : '';
                        const productFlavorPart = product ? (product.Plan_Cat_Presentación.split(',')[1]?.trim() || '') : '';
                        return (
                          <li key={itemIndex} className="bg-gray-50 py-0.5 px-3 rounded-md border border-gray-100 flex items-start text-sm">
                            <span className="w-10 font-bold text-gray-700 shrink-0">{item.Position_ID}:</span>
                            <span className="flex-grow text-gray-700 min-w-0">
                              <p className="leading-tight">{product ? `${product.Plan_Cat_Descripción}` : 'Producto Desconocido'}</p>
                              <p className="text-gray-600 text-xs leading-tight">{product ? `Sabor: ${productFlavorPart}` : ''}</p>
                            </span>
                            <span className="w-14 text-center text-gray-700 shrink-0 mr-6">x{item.Quantity}</span>
                            <span className="w-24 text-right font-medium text-gray-800 shrink-0">
                              {product ? `${(product.Plan_Cat_Costo * item.Quantity).toFixed(2)} ${product.Plan_Cat_Moneda}` : ''}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="font-bold text-md text-right mt-2 text-gray-800">
                      Subtotal Pedido: {
                        order.Items.reduce((sum, item) => {
                          const product = getProductDetails(item.Plan_Cat_ID);
                          return sum + (product ? product.Plan_Cat_Costo * item.Quantity : 0);
                        }, 0).toFixed(2)
                      } USD
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleConsolidateOrders}
              className={`w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md flex items-center justify-center ${Object.keys(selectedOrderIds).length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={Object.keys(selectedOrderIds).length === 0}
            >
              <FileText className="mr-2 h-5 w-5" />Consolidar Pedidos Seleccionados
            </button>
          </>
        )}

        <h3 className="text-2xl font-bold text-gray-800 mb-6 mt-8 border-t pt-8 border-gray-200">Pedidos Consolidados</h3>
        {consolidatedOrders.length === 0 ? (
          <p className="text-center text-gray-600 text-lg">No hay pedidos consolidados.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {consolidatedOrders.map((order) => (
              <div key={order.Order_ID} className="bg-teal-50 rounded-xl shadow-sm p-6 border border-teal-200">
                <div className="flex justify-between items-start mb-4 border-b pb-3 border-teal-200">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Pedido Consolidado #{order.Order_ID}</h3>
                    <p className="text-sm text-gray-600">Consolidado por: {order.Cliente_Nombre}</p>
                    <p className="text-sm text-gray-600">Fecha: {order.Order_Date}</p>
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mt-2 bg-teal-200 text-teal-900`}>
                      {order.Status}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {/* Botón de Exportar PDF para pedidos consolidados */}
                    <button
                      onClick={() => handleExportToPdf(order)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition duration-300 shadow-md text-sm flex items-center"
                      title="Exportar Pedido a PDF"
                    >
                      <FileText className="h-4 w-4 mr-1" />PDF
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Detalles de los Productos Consolidados:</h4>
                  <ul className="space-y-0.5 w-full"> 
                    <li className="bg-gray-100 py-1 px-3 rounded-md border border-gray-200 grid grid-cols-[10%_25%_25%_15%_10%_15%] text-xs font-semibold text-gray-700">
                        <span className="text-left">Pos.</span>
                        <span className="text-left">Producto</span>
                        <span className="text-left">Cliente Original</span>
                        <span className="text-left">Pedido Original</span>
                        <span className="text-center">Cant.</span>
                        <span className="text-right">Subtotal</span>
                    </li>
                    {order.Items
                      .slice()
                      .sort((a, b) => {
                        const productA = `${a.Plan_Cat_Descripción} ${a.Plan_Cat_Presentación.split(',')[1]?.trim() || ''}`;
                        const productB = `${b.Plan_Cat_Descripción} ${b.Plan_Cat_Presentación.split(',')[1]?.trim() || ''}`;
                        if (productA < productB) return -1;
                        if (productA > productB) return 1;

                        const originalOrderIdA = parseInt(a.Original_Order_ID?.replace('ORD', '') || '0');
                        const originalOrderIdB = parseInt(b.Original_Order_ID?.replace('ORD', '') || '0');
                        if (originalOrderIdA < originalOrderIdB) return -1;
                        if (originalOrderIdA > originalOrderIdB) return 1;

                        return a.Original_Order_Position_ID - b.Original_Order_Position_ID;
                      })
                      .map((item, itemIndex) => (
                      <li key={itemIndex} className="bg-white py-0.5 px-3 rounded-md border border-gray-100 grid grid-cols-[10%_25%_25%_15%_10%_15%] items-start text-sm">
                        <span className="font-bold text-gray-700 text-left">{item.Position_ID}:</span>
                        <span className="text-gray-700 text-left">
                          <p className="leading-tight">{item.Plan_Cat_Descripción}</p>
                          <p className="text-gray-600 text-xs leading-tight">Sabor: {item.Plan_Cat_Presentación.split(',')[1]?.trim()}</p>
                        </span>
                        <span className="text-left text-gray-600">{item.Original_Cliente_Nombre}</span>
                        <span className="text-left text-gray-600">{`${item.Original_Order_ID}.${item.Original_Order_Position_ID}`}</span>
                        <span className="text-center text-gray-700">x{item.Quantity}</span>
                        <span className="text-right font-medium text-gray-800">
                          {(item.Plan_Cat_Costo * item.Quantity).toFixed(2)} {item.Plan_Cat_Moneda}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="font-bold text-lg text-right mt-4 text-gray-800">
                    Total Consolidado: {
                      order.Items.reduce((sum, item) => sum + (item.Plan_Cat_Costo * item.Quantity), 0).toFixed(2)
                    } USD
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// Componente principal de la aplicación
const App = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login'); // 'login', 'dashboard', 'catalog', 'new-order', 'my-orders', 'change-password', 'admin-orders'
  const [orders, setOrders] = useState(mockPlanes); // Pedidos finales/completados
  const [provisionalOrders, setProvisionalOrders] = useState([]); // Pedidos provisionales
  const [nextProvisionalOrderId, setNextProvisionalOrderId] = useState(490001); // Para IDs de pedidos provisionales
  const [editingOrder, setEditingOrder] = useState(null); // Estado para editar un pedido

  // Estado para el modal de mensaje
  const [message, setMessageState] = useState({ msg: '', type: '' });
  const handleCloseMessageModal = () => setMessageState({ msg: '', type: '' });

  // Estados para el modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalOnConfirm, setConfirmModalOnConfirm] = useState(() => () => { }); // Función a ejecutar al confirmar

  const showMessage = (msg, type) => {
    setMessageState({ msg, type });
  };

  const handleLogin = (user) => {
    setLoggedInUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setCurrentPage('login');
    showMessage('Has cerrado sesión.', 'info');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onLogin={handleLogin} setMessage={showMessage} />;
      case 'dashboard':
        return <Dashboard loggedInUser={loggedInUser} onLogout={handleLogout} setCurrentPage={setCurrentPage} setMessage={showMessage} />;
      case 'catalog':
        return <ProductCatalog setCurrentPage={setCurrentPage} />;
      case 'new-order':
        return <NewOrder
          loggedInUser={loggedInUser}
          setCurrentPage={setCurrentPage}
          orders={orders}
          setOrders={setOrders}
          provisionalOrders={provisionalOrders}
          setProvisionalOrders={setProvisionalOrders}
          nextProvisionalOrderId={nextProvisionalOrderId}
          setNextProvisionalOrderId={setNextProvisionalOrderId}
          setMessage={showMessage}
          editingOrder={editingOrder}
          setEditingOrder={setEditingOrder}
        />;
      case 'my-orders':
        return <MyOrders
          loggedInUser={loggedInUser}
          setCurrentPage={setCurrentPage}
          orders={orders}
          setOrders={setOrders}
          provisionalOrders={provisionalOrders}
          setProvisionalOrders={setProvisionalOrders}
          setMessage={showMessage}
          setConfirmModalMessage={setConfirmModalMessage}
          setConfirmModalOnConfirm={setConfirmModalOnConfirm}
          setShowConfirmModal={setShowConfirmModal}
          setEditingOrder={setEditingOrder}
        />;
      case 'change-password':
        return <ChangePassword loggedInUser={loggedInUser} setCurrentPage={setCurrentPage} setMessage={showMessage} />;
      case 'admin-orders':
        if (loggedInUser?.Cliente_Perfil === 'Admin') {
          return <AdminOrdersView
            loggedInUser={loggedInUser}
            setCurrentPage={setCurrentPage}
            orders={orders}
            setOrders={setOrders}
            setMessage={showMessage}
            consolidatedOrders={[]} // No hay mock de consolidado por defecto
            setConsolidatedOrders={() => {}} // No hay setter por defecto
            nextConsolidatedOrderId={1} // No hay nextId por defecto
            setNextConsolidatedOrderId={() => {}} // No hay setter por defecto
            provisionalOrders={provisionalOrders} // Se necesitan para consolidar
          />;
        }
        return <h2 className="text-center text-red-500">Acceso Denegado</h2>; // Redirigir o mostrar error
      default:
        return <Login onLogin={handleLogin} setMessage={showMessage} />;
    }
  };

  return (
    <>
      {/* Carga de Tailwind CSS y fuente Inter, estos no necesitan ser dinámicos */}
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>
        {`
          body {
            font-family: 'Inter', sans-serif;
          }
          /* Custom scrollbar for better aesthetics */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}
      </style>

      {renderPage()}
      <MessageModal
        message={message.msg}
        type={message.type}
        onClose={handleCloseMessageModal}
      />
      <ConfirmModal
        show={showConfirmModal}
        message={confirmModalMessage}
        onConfirm={() => {
          confirmModalOnConfirm(); // Ejecuta la acción de confirmación almacenada
          setShowConfirmModal(false); // Cierra el modal
        }}
        onCancel={() => setShowConfirmModal(false)}
      />
    </>
  );
};

export default App;
