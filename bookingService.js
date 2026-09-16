const STORAGE_KEY = 'cinebook-data-v1'

const movies = [
  { id: 'neon', title: 'Neon Horizon', genre: 'Sci-fi · Thriller', runtime: '2h 14m', rating: '16+', score: '8.7', color: 'violet', description: 'In a city where memories are currency, one courier runs out of time.', featured: true },
  { id: 'paper', title: 'Paper Moons', genre: 'Drama · Romance', runtime: '1h 48m', rating: '12A', score: '8.2', color: 'amber', description: 'Two strangers find a map to the lives they almost lived.' },
  { id: 'wild', title: 'Wildwood', genre: 'Adventure · Family', runtime: '1h 56m', rating: 'PG', score: '8.5', color: 'green', description: 'A curious brother and sister discover a forest that remembers.' },
  { id: 'signal', title: 'The Last Signal', genre: 'Mystery · Crime', runtime: '2h 02m', rating: '15', score: '8.9', color: 'red', description: 'Every city has a secret frequency. This one should stay silent.' },
]

const cinemas = [
  { id: 'north', name: 'CineBook North', area: 'Kingston Quarter', distance: '0.8 mi' },
  { id: 'riverside', name: 'CineBook Riverside', area: 'Riverside Walk', distance: '2.1 mi' },
  { id: 'central', name: 'CineBook Central', area: 'The Old Exchange', distance: '3.4 mi' },
]

const times = ['10:20 AM', '12:45 PM', '3:10 PM', '5:35 PM', '8:15 PM']
const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const seatNumbers = Array.from({ length: 10 }, (_, index) => index + 1)
const seedBookedSeats = ['A3', 'A4', 'B8', 'C1', 'C2', 'D6', 'E5', 'F9', 'G2', 'G3', 'H7']

const defaultData = { movies, cinemas, showtimes: [], seats: [], customers: [], bookings: [] }

class SeatUnavailableError extends Error {
  constructor(seats) {
    super(`Seat${seats.length > 1 ? 's' : ''} ${seats.join(', ')} ${seats.length > 1 ? 'are' : 'is'} no longer available.`)
    this.name = 'SeatUnavailableError'
    this.seats = seats
  }
}

function createRepository() {
  let memoryData = null
  const read = () => {
    try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) } catch { return memoryData }
  }
  const write = (data) => {
    memoryData = data
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* Memory fallback. */ }
  }
  const getData = () => {
    const stored = read()
    if (stored?.movies && stored?.bookings) return stored
    const seeded = { ...defaultData, movies: [...movies], cinemas: [...cinemas] }
    write(seeded)
    return seeded
  }
  return { getData, write }
}

const repository = createRepository()

function showtimeId({ movieId, cinemaId, date, time }) {
  return [movieId, cinemaId, date, time].join('|')
}

function ensureShowtime(data, details) {
  const id = showtimeId(details)
  let showtime = data.showtimes.find((item) => item.id === id)
  if (!showtime) {
    showtime = { id, ...details }
    data.showtimes.push(showtime)
    data.seats.push({ showtimeId: id, booked: [...seedBookedSeats] })
  }
  return showtime
}

function createBookingReference(existingReferences) {
  let reference
  do {
    reference = `CB-${Date.now().toString(36).slice(-4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  } while (existingReferences.has(reference))
  return reference
}

export const bookingService = {
  getMovies: () => repository.getData().movies,
  getCinemas: () => repository.getData().cinemas,
  getTimes: () => times,
  getRows: () => rows,
  getSeatNumbers: () => seatNumbers,
  getBookedSeats: (details) => {
    const data = repository.getData()
    const showtime = ensureShowtime(data, details)
    const seats = data.seats.find((item) => item.showtimeId === showtime.id)
    const bookedByOrders = data.bookings.filter((item) => item.showtimeId === showtime.id).flatMap((item) => item.seatIds)
    repository.write(data)
    return [...new Set([...(seats?.booked || []), ...bookedByOrders])]
  },
  createBooking: ({ movieId, cinemaId, date, time, seatIds, customer }) => {
    const data = repository.getData()
    const showtime = ensureShowtime(data, { movieId, cinemaId, date, time })
    const bookedSeats = bookingService.getBookedSeats({ movieId, cinemaId, date, time })
    const unavailableSeats = seatIds.filter((seat) => bookedSeats.includes(seat))
    if (unavailableSeats.length) throw new SeatUnavailableError(unavailableSeats)

    const customerRecord = { id: `customer-${Date.now()}`, ...customer }
    const booking = {
      id: `booking-${Date.now()}`,
      reference: createBookingReference(new Set(data.bookings.map((item) => item.reference))),
      showtimeId: showtime.id,
      movieId,
      cinemaId,
      date,
      time,
      seatIds: [...seatIds],
      customerId: customerRecord.id,
      total: seatIds.length * 14.5,
      createdAt: new Date().toISOString(),
    }
    data.customers.push(customerRecord)
    data.bookings.push(booking)
    repository.write(data)
    return booking
  },
  getBookings: () => repository.getData().bookings,
}

export { SeatUnavailableError }