import Home from "./Home";
import { getBoard } from "./sleeper";

// Rebuild the board from Sleeper at most every 30 minutes.
export const revalidate = 1800;

export default async function Page() {
  const board = await getBoard();
  return <Home board={board} />;
}
