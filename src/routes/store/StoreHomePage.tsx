import { useOutletContext } from 'react-router-dom'
import type { Store } from '@/types/domain'
import StorePage from './StorePage'
import StoreAboutPage from './StoreAboutPage'

/** The store root ("/") renders the catalog or the about page, depending on
 * the owner's `home_view` choice. The other view always stays reachable at
 * its own dedicated path (/catalogo or /sobre). */
export default function StoreHomePage() {
  const store = useOutletContext<Store>()
  return store.home_view === 'about' ? <StoreAboutPage /> : <StorePage />
}
