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
            { id: 'FARM-001', aadharId: '1001 2002 3003', fullName: 'Rajesh Kumar Sharma', mobile: '9876543210', location: 'Aurangabad, Maharashtra', farmerType: 'farmer', farmSize: '2.5 acres', certificationStatus: 'Organic Certified', cropTypes: ['Ashwagandha', 'Brahmi'], complianceScore: 95, bankAccount: 'XXXX-4521', createdAt: new Date() },
            { id: 'FARM-002', aadharId: '1001 2002 3004', fullName: 'Suresh Patil', mobile: '9876543211', location: 'Pune, Maharashtra', farmerType: 'farmer', farmSize: '1.8 acres', certificationStatus: 'GAP Certified', cropTypes: ['Tulsi', 'Neem'], complianceScore: 88, bankAccount: 'XXXX-7890', createdAt: new Date() },
            { id: 'FARM-003', aadharId: '1001 2002 3005', fullName: 'Amit Sharma', mobile: '9876543212', location: 'Nashik, Maharashtra', farmerType: 'collector', farmSize: '3.2 acres', certificationStatus: 'Organic', cropTypes: ['Shatavari', 'Amla'], complianceScore: 92, bankAccount: 'XXXX-2468', createdAt: new Date() },
            { id: 'FARM-004', aadharId: '1001 2002 3006', fullName: 'Vikram Singh', mobile: '9876543213', location: 'Nagpur, Maharashtra', farmerType: 'farmer', farmSize: '4.5 acres', certificationStatus: 'Fair Trade', cropTypes: ['Giloy', 'Triphala'], complianceScore: 90, bankAccount: 'XXXX-1234', createdAt: new Date() }
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

        // 3. Seed Demo Batches
        const qBatches = query(collection(firestore, 'batches'), limit(1));
        const snapshotBatches = await getDocs(qBatches);
        if (snapshotBatches.empty) {
          console.log("Seeding Demo Batches...");
          const demoBatches = [
            { 
              batch_id: 'BATCH-001', 
              type: 'batch', 
              status: 'received', 
              creator_id: 'AGG-1001', 
              current_owner_id: 'AGG-1001', 
              quantity: '500kg', 
              herb_name: 'Ashwagandha', 
              created_at: new Date().toISOString(),
              metadata: { condition: 'Premium', moisture: '8%' }
            },
            { 
              batch_id: 'PROC-B-99', 
              type: 'processed', 
              status: 'verified', 
              creator_id: 'PROC-2001', 
              current_owner_id: 'PROC-2001', 
              quantity: '150kg', 
              herb_name: 'Brahmi Extract', 
              created_at: new Date().toISOString(),
              metadata: { 
                operation: 'Extractions', 
                temperature: '65', 
                duration: '12', 
                qualityTest: { 
                  testType: 'AYUSH Premium', 
                  results: 'PASSED', 
                  authority: 'Central Lab', 
                  timestamp: new Date().toISOString() 
                } 
              }
            },
            { 
              batch_id: 'LOT-505', 
              type: 'lot', 
              status: 'dispatched', 
              creator_id: 'AGG-1001', 
              current_owner_id: 'PROC-2001', 
              quantity: '1200kg', 
              herb_name: 'Tulsi Leaves', 
              created_at: new Date().toISOString(),
              metadata: { 
                waybill: 'WB-78891', 
                vehicle: 'MH-12-AS-9080' 
              }
            }
          ];
          for (const batch of demoBatches) {
            await addDoc(collection(firestore, 'batches'), batch);
          }
          console.log("Demo batches successfully seeded.");
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
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
