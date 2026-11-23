import { BrowserRouter } from 'react-router';
import { AppRoutes } from '../routes';
import { ExtensionsProvider } from '../features/extensions/extensions';
import { RestaurantProvider } from './restaurant-context';

export function App() {
  return (
    <RestaurantProvider>
      <ExtensionsProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ExtensionsProvider>
    </RestaurantProvider>
  );
}
