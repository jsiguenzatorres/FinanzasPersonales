import { TripForm } from './trip-form';
import { getMySpaces } from '@/lib/collab/get-my-spaces';

export default async function NewTripPage() {
  const spaces = await getMySpaces();

  return (
    <div className="mx-auto max-w-lg">
      <TripForm spaces={spaces} />
    </div>
  );
}
