import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { collection, getDocs, addDoc, query, limit } from 'firebase/firestore';
import { firestore } from '@/integrations/firebase/client';

const queryClient = new QueryClient();

const App = () => {
  console.log("App loaded");

  // Automated Mock DB Seeder
  useEffect(() => {
    const seedDatabases = async () => {
      try {
        // 1. Seed Farmers
        const qFarmers = query(collection(firestore, 'farmers'), limit(1));
        const snapshotFarmers = await getDocs(qFarmers);
        if (snapshotFarmers.empty) {
          console.log("Seeding Farmers...");
          const farmers = [
            { id: 'FARM-001', aadharId: '1001 2002 3003', fullName: 'Rajesh Kumar', mobile: '9876543210', location: 'Aurangabad, Maharashtra', farmerType: 'farmer', createdAt: new Date() },
            { id: 'FARM-002', aadharId: '1001 2002 3004', fullName: 'Suresh Patil', mobile: '9876543211', location: 'Pune, Maharashtra', farmerType: 'farmer', createdAt: new Date() },
            { id: 'FARM-003', aadharId: '1001 2002 3005', fullName: 'Amit Sharma', mobile: '9876543212', location: 'Nashik, Maharashtra', farmerType: 'collector', createdAt: new Date() },
            { id: 'FARM-004', aadharId: '1001 2002 3006', fullName: 'Vikram Singh', mobile: '9876543213', location: 'Nagpur, Maharashtra', farmerType: 'farmer', createdAt: new Date() },
            { id: 'FARM-005', aadharId: '1001 2002 3007', fullName: 'Anil Deshmukh', mobile: '9876543214', location: 'Kolhapur, Maharashtra', farmerType: 'collector', createdAt: new Date() },
            { id: 'FARM-006', aadharId: '1001 2002 3008', fullName: 'Bhavna Yadav', mobile: '9876543215', location: 'Solapur, Maharashtra', farmerType: 'farmer', createdAt: new Date() },
            { id: 'FARM-007', aadharId: '1001 2002 3009', fullName: 'Kavita Shinde', mobile: '9876543216', location: 'Sillod, Maharashtra', farmerType: 'farmer', createdAt: new Date() },
            { id: 'FARM-008', aadharId: '1001 2002 3010', fullName: 'Ramesh Pawar', mobile: '9876543217', location: 'Satara, Maharashtra', farmerType: 'collector', createdAt: new Date() }
          ];
          for (const farmer of farmers) {
            await addDoc(collection(firestore, 'farmers'), farmer);
          }
          console.log("Database successfully seeded with 8 farmers.");
        }

        // 2. Seed Demo Business Nodes (Aggregators, Processors, etc)
        const qNodes = query(collection(firestore, 'business_nodes'), limit(1));
        const snapshotNodes = await getDocs(qNodes);
        if (snapshotNodes.empty) {
          console.log("Seeding Demo Business Nodes...");
          const businessNodes = [
            { role: 'aggregator', id: 'AGG-1001', password: 'password123', name: 'MahaAgri Aggregators', location: 'Aurangabad' },
            { role: 'aggregator', id: 'AGG-1002', password: 'password123', name: 'Kisan Connect Aggregators', location: 'Pune' },
            { role: 'processor', id: 'PROC-2001', password: 'password123', name: 'Western Ghats Processing Center', location: 'Nashik' },
            { role: 'processor', id: 'PROC-2002', password: 'password123', name: 'Deccan Extracts Plant', location: 'Solapur' },
            { role: 'manufacturer', id: 'MFG-3001', password: 'password123', name: 'Ayurveda Life Labs', location: 'Satara' },
            { role: 'manufacturer', id: 'MFG-3002', password: 'password123', name: 'Patanjali Synthetics', location: 'Mumbai' },
            { role: 'distributor', id: 'DIST-4001', password: 'password123', name: 'All-India Logistics Depot', location: 'Nagpur' },
            { role: 'distributor', id: 'DIST-4002', password: 'password123', name: 'Sahyadri Transit Services', location: 'Kolhapur' }
          ];
          for (const node of businessNodes) {
            await addDoc(collection(firestore, 'business_nodes'), node);
          }
          console.log("Database successfully seeded with 8 Demo Business Nodes.");
        }
      } catch(e) {
        console.error("Firebase Seeding failed (Make sure your config is valid):", e);
      }
    };
    seedDatabases();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
