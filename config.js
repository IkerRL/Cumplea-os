// ============================================================
// Configuración de Firebase
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCrDWPvXwXVlReMRzvf-amAXS0va0-vgts",
  authDomain: "regalocumple-eaeff.firebaseapp.com",
  projectId: "regalocumple-eaeff",
  storageBucket: "regalocumple-eaeff.firebasestorage.app",
  messagingSenderId: "215876322731",
  appId: "1:215876322731:web:3f8eb08d26ace47fca3eee"
};

// Inicializar Firebase (el SDK ya debe estar cargado antes que este script)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
