import BookRideForm from "@/components/passenger/BookRideForm";

export default function PassengerBookRidePage() {
  return (
    <main className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-300">
          Passenger
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">Book a Ride</h1>
        <p className="mt-2 text-sm leading-7 text-slate-400">
          Enter your trip details and submit a real ride request.
        </p>
      </div>

      <BookRideForm />
    </main>
  );
}