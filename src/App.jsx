const App = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000000",
        color: "#ffffff",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ color: "#00ffff" }}>Portfolio Test - React Working!</h1>
      <h2>Environment: {import.meta.env.MODE}</h2>
      <h2>Production: {String(import.meta.env.PROD)}</h2>
      <h2>Timestamp: {new Date().toISOString()}</h2>
      <p style={{ color: "#00ff00", fontWeight: "bold", marginTop: "20px" }}>
        If you see this, React and Vite are working correctly!
      </p>
    </div>
  );
};

// Full app (commented out for testing)
// const FullApp = () => (
//   <div className="overflow-x-hidden antialiased text-neutral-300 selection:bg-cyan-300 selection:text-cyan-900">
//     <div className="fixed top-0 w-full h-full -z-10">
//       <div className="relative w-full h-full bg-black">
//         <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
//         <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
//       </div>
//     </div>
//     <div className="container px-8 mx-auto">
//       <Navbar />
//       <Hero />
//       <About />
//       <Technologies />
//       <Experience />
//       <Projects />
//       <Contact />
//       <Footer />
//     </div>
//     <ProductionDebug />
//   </div>
// );

export default App;
