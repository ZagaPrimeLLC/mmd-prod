const stats = [
  { value: '100+', label: 'Families Served' },
  { value: '4+', label: 'Years Experience' },
  { value: '50+', label: 'Care Professionals' },
  { value: '100%', label: 'Statewide Coverage' },
];

export default function StatsBand() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <dl className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dd className="mb-2 text-4xl font-bold text-navy md:text-5xl">{s.value}</dd>
              <dt className="font-medium text-gray-600">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
