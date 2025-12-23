import { RouterProvider, Route } from "react-router-dom";
import { router } from "@/app/router";
import BuyerPassport from "@/pages/buyers/BuyerPassport";

export function App() {
  return <RouterProvider router={router} />;
  <Route path="/buyers/passport" element={<BuyerPassport />} />
}

export default App;
