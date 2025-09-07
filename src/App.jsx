// Phase 2: Add Hero component (most likely culprit)
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";

const App = () => {
  console.log("App rendering - Phase 2: Adding Hero");

  return (
    <div className="overflow-x-hidden antialiased text-neutral-300 selection:bg-cyan-300 selection:text-cyan-900">
      {/* Basic background without complex gradients */}
      <div className="fixed top-0 w-full h-full -z-10 bg-black"></div>

      <div className="container px-8 mx-auto">
        <Navbar />

        {/* Test status indicator */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#111",
            margin: "20px 0",
            borderRadius: "8px",
          }}
        >
          <h2 style={{ color: "#00ffff" }}>Phase 2: Hero Component Test</h2>
          <p style={{ color: "#00ff00" }}>✅ Navbar loaded</p>
          <p style={{ color: "#ffff00" }}>🔄 Testing Hero component...</p>
          <p>Environment: {import.meta.env.MODE}</p>
        </div>

        <Hero />

        {/* Post-Hero status */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#111",
            margin: "20px 0",
            borderRadius: "8px",
          }}
        >
          <p style={{ color: "#00ff00" }}>
            ✅ Hero component loaded successfully!
          </p>
        </div>
      </div>
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
