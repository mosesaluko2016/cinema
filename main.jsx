import { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, Clock3, CreditCard, Film, MapPin, Menu, Play, Search, ShieldCheck, Sparkles, Ticket, UserRound, X } from 'lucide-react'
import { bookingService, SeatUnavailableError } from './domain/bookingService'
import './styles.css'

const movies = bookingService.getMovies()
const cinemas = bookingService.getCinemas()
const times = bookingService.getTimes()
const rows = bookingService.getRows()
const seatNumbers = bookingService.getSeatNumbers()

function App() {
  const [step, setStep] = useState('browse')
  const [selectedMovie, setSelectedMovie] = useState(movies[0])
  const [selectedCinema, setSelectedCinema] = useState(cinemas[0])
  const [selectedTime, setSelectedTime] = useState(times[3])
  const [selectedDate, setSelectedDate] = useState('Sat, Sep 19')
  const [selectedSeats, setSelectedSeats] = useState([])
  const [mobileMenu, setMobileMenu] = useState(false)
  const [booking, setBooking] = useState(null)

  const total = selectedSeats.length * 14.5
  const progress = { browse: 0, showtime: 25, seats: 50, payment: 75, confirmation: 100 }[step]
  const showtimeDetails = { movieId: selectedMovie.id, cinemaId: selectedCinema.id, date: selectedDate, time: selectedTime }

  const chooseMovie = (movie) => {
    setSelectedMovie(movie)
    setSelectedSeats([])
    setBooking(null)
    setStep('showtime')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const changeShowtimeSelection = (setter) => (value) => {
    setter(value)
    setSelectedSeats([])
  }

  const toggleSeat = (seat) => {
    if (bookingService.getBookedSeats(showtimeDetails).includes(seat)) return
    setSelectedSeats((current) => current.includes(seat) ? current.filter((item) => item !== seat) : [...current, seat])
  }

  const resetBooking = () => {
    setSelectedSeats([])
    setBooking(null)
    setStep('browse')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" onClick={resetBooking} aria-label="CineBook home"><span className="brand-mark"><Film size={18} /></span><span>Cine<span>Book</span></span></a>
        <button className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation">{mobileMenu ? <X size={21} /> : <Menu size={21} />}</button>
        <nav className={mobileMenu ? 'main-nav is-open' : 'main-nav'}>
          <a href="#movies" onClick={() => { setStep('browse'); setMobileMenu(false) }}>Movies</a>
          <a href="#locations" onClick={() => setMobileMenu(false)}>Cinemas</a>
          <a href="#offers" onClick={() => setMobileMenu(false)}>Offers</a>
        </nav>
        <div className="header-actions"><button className="icon-button" aria-label="Search"><Search size={19} /></button><button className="account-button"><UserRound size={17} /> Account</button></div>
      </header>

      {step !== 'browse' && step !== 'confirmation' && <div className="progress-track"><div className="progress-value" style={{ width: `${progress}%` }} /></div>}

      <main id="top">
        {step === 'browse' && <Browse onChooseMovie={chooseMovie} />}
        {step === 'showtime' && <Showtime movie={selectedMovie} cinema={selectedCinema} setCinema={changeShowtimeSelection(setSelectedCinema)} time={selectedTime} setTime={changeShowtimeSelection(setSelectedTime)} date={selectedDate} setDate={changeShowtimeSelection(setSelectedDate)} onBack={() => setStep('browse')} onContinue={() => setStep('seats')} />}
        {step === 'seats' && <Seats movie={selectedMovie} cinema={selectedCinema} time={selectedTime} date={selectedDate} selectedSeats={selectedSeats} toggleSeat={toggleSeat} onBack={() => setStep('showtime')} onContinue={() => setStep('payment')} />}
        {step === 'payment' && <Payment movie={selectedMovie} cinema={selectedCinema} time={selectedTime} date={selectedDate} selectedSeats={selectedSeats} total={total} onBack={() => setStep('seats')} onComplete={(createdBooking) => { setBooking(createdBooking); setStep('confirmation') }} />}
        {step === 'confirmation' && <Confirmation movie={selectedMovie} cinema={selectedCinema} time={selectedTime} date={selectedDate} selectedSeats={selectedSeats} total={total} bookingCode={booking?.reference} onReset={resetBooking} />}
      </main>

      {step === 'browse' && <footer><div className="footer-brand"><span className="brand-mark"><Film size={16} /></span> CineBook</div><span>Great films. Better seats.</span><span className="footer-copy">© 2026 CineBook</span></footer>}
    </div>
  )
}

function Browse({ onChooseMovie }) {
  return <>
    <section className="hero-section">
      <div className="hero-copy"><div className="eyebrow"><Sparkles size={14} /> The new way to watch</div><h1>Make tonight<br /><em>cinema.</em></h1><p>Find your next great story, pick the perfect seat, and settle in. Your night out starts here.</p><button className="primary-button hero-cta" onClick={() => document.getElementById('movies').scrollIntoView({ behavior: 'smooth' })}>Explore movies <ArrowRight size={17} /></button></div>
      <div className="hero-art"><div className="hero-sun" /><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-ticket"><Ticket size={18} /><span>Now showing</span><strong>Stories worth<br />leaving home for.</strong></div><div className="hero-reel reel-one" /><div className="hero-reel reel-two" /></div>
    </section>
    <section className="movie-section" id="movies"><div className="section-heading"><div><span className="section-kicker">Curated for you</span><h2>Now showing</h2></div><button className="text-button">View all <ArrowRight size={15} /></button></div><div className="movie-grid">{movies.map((movie) => <MovieCard key={movie.id} movie={movie} onChooseMovie={onChooseMovie} />)}</div></section>
    <section className="info-strip" id="offers"><div><span className="strip-icon"><Clock3 size={19} /></span><div><strong>Late-night classics</strong><span>Films from $9.50 after 9 PM</span></div></div><div><span className="strip-icon"><ShieldCheck size={19} /></span><div><strong>Book with confidence</strong><span>Free exchanges up to 30 min before</span></div></div><div><span className="strip-icon"><MapPin size={19} /></span><div><strong>Three local cinemas</strong><span>Easy to find. Hard to leave.</span></div></div></section>
  </>
}

function MovieCard({ movie, onChooseMovie }) {
  return <article className={`movie-card ${movie.featured ? 'featured-card' : ''}`}><div className={`poster poster-${movie.color}`}><div className="poster-noise" /><span className="poster-rating">{movie.rating}</span><span className="poster-title">{movie.title}</span><span className="poster-line">A CINEBOOK ORIGINAL</span><button className="poster-play" onClick={() => onChooseMovie(movie)} aria-label={`Book ${movie.title}`}><Play size={17} fill="currentColor" /></button></div><div className="movie-details"><div><h3>{movie.title}</h3><p>{movie.genre} <span>·</span> {movie.runtime}</p></div><span className="score">★ {movie.score}</span></div></article>
}

function StepHeader({ step, title, subtitle, onBack }) {
  return <div className="step-header"><button className="back-button" onClick={onBack}><ArrowLeft size={17} /> Back</button><div><span className="section-kicker">Step {step} of 3</span><h1>{title}</h1><p>{subtitle}</p></div></div>
}

function BookingSummary({ movie, cinema, time, date, selectedSeats = [], total = selectedSeats.length * 14.5 }) {
  return <aside className="booking-summary"><div className={`summary-poster poster poster-${movie.color}`}><span className="poster-title">{movie.title}</span></div><div className="summary-content"><span className="section-kicker">Your booking</span><h3>{movie.title}</h3><div className="summary-line"><CalendarDays size={15} /> {date}</div><div className="summary-line"><Clock3 size={15} /> {time}</div><div className="summary-line"><MapPin size={15} /> {cinema.name}</div>{selectedSeats.length > 0 && <><div className="summary-divider" /><div className="summary-row"><span>Seats <b>{selectedSeats.join(', ')}</b></span><span>${(selectedSeats.length * 14.5).toFixed(2)}</span></div><div className="summary-row total-row"><span>Total</span><strong>${total.toFixed(2)}</strong></div></>}</div></aside>
}

function Showtime({ movie, cinema, setCinema, time, setTime, date, setDate, onBack, onContinue }) {
  return <div className="flow-page"><StepHeader step="1" title="Where and when?" subtitle="Choose a cinema and showtime for your visit." onBack={onBack} /><div className="flow-layout"><div className="flow-main"><section className="flow-section"><label className="field-label">Select a date</label><div className="date-row">{['Fri, Sep 18', 'Sat, Sep 19', 'Sun, Sep 20', 'Mon, Sep 21'].map((item, index) => <button key={item} className={`date-option ${date === item ? 'selected' : ''}`} onClick={() => setDate(item)}><small>{index === 0 ? 'TODAY' : index === 1 ? 'TOMORROW' : 'THIS WEEK'}</small><strong>{item.split(', ')[1].split(' ')[0]}</strong><span>{item.split(', ')[0]}</span></button>)}</div></section><section className="flow-section" id="locations"><label className="field-label">Select a cinema</label><div className="cinema-list">{cinemas.map((item) => <button key={item.id} className={`cinema-option ${cinema.id === item.id ? 'selected' : ''}`} onClick={() => setCinema(item)}><span className="radio-dot" /><span className="cinema-info"><strong>{item.name}</strong><small>{item.area} · {item.distance}</small></span><ChevronDown size={17} /></button>)}</div></section><section className="flow-section"><label className="field-label">Select a showtime</label><div className="time-grid">{times.map((item) => <button key={item} className={`time-option ${time === item ? 'selected' : ''}`} onClick={() => setTime(item)}>{item}<small>{item === '5:35 PM' ? 'Best availability' : 'Standard'}</small></button>)}</div></section><button className="primary-button continue-button" onClick={onContinue}>Choose your seats <ArrowRight size={17} /></button></div><BookingSummary movie={movie} cinema={cinema} time={time} date={date} /></div></div>
}

function Seats({ movie, cinema, time, date, selectedSeats, toggleSeat, onBack, onContinue }) {
  const bookedSeats = bookingService.getBookedSeats({ movieId: movie.id, cinemaId: cinema.id, date, time })
  const canSelectMore = selectedSeats.length < 8
  return <div className="flow-page"><StepHeader step="2" title="Pick your seats" subtitle="Choose up to 8 seats. You are almost there." onBack={onBack} /><div className="flow-layout seats-layout"><div className="flow-main"><div className="screen-wrap"><div className="screen">SCREEN</div><span>Front of auditorium</span></div><div className="seat-map">{rows.map((row) => <div className="seat-row" key={row}><span className="row-label">{row}</span>{seatNumbers.map((number) => { const seat = `${row}${number}`; const isBooked = bookedSeats.includes(seat); const isSelected = selectedSeats.includes(seat); return <button key={seat} disabled={isBooked || (!isSelected && !canSelectMore)} className={`seat ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''} ${number === 5 ? 'aisle-gap' : ''}`} onClick={() => toggleSeat(seat)} aria-label={`${seat}${isBooked ? ' booked' : isSelected ? ' selected' : ''}`}>{number}</button> })}<span className="row-label">{row}</span></div>)}</div><div className="seat-legend"><span><i className="seat available" /> Available</span><span><i className="seat selected" /> Selected</span><span><i className="seat booked" /> Sold</span></div><button className="primary-button continue-button" disabled={!selectedSeats.length} onClick={onContinue}>Continue to payment <ArrowRight size={17} /></button></div><BookingSummary movie={movie} cinema={cinema} time={time} date={date} selectedSeats={selectedSeats} total={selectedSeats.length * 14.5} /></div></div>
}

function Payment({ movie, cinema, time, date, selectedSeats, total, onBack, onComplete }) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const submitPayment = (event) => {
    event.preventDefault()
    setProcessing(true)
    setError('')
    const customerName = new FormData(event.currentTarget).get('cardholderName')
    setTimeout(() => {
      try {
        const createdBooking = bookingService.createBooking({ movieId: movie.id, cinemaId: cinema.id, date, time, seatIds: selectedSeats, customer: { name: customerName } })
        onComplete(createdBooking)
      } catch (bookingError) {
        setProcessing(false)
        setError(bookingError instanceof SeatUnavailableError ? bookingError.message : 'We could not complete this booking. Please try again.')
      }
    }, 700)
  }
  return <div className="flow-page"><StepHeader step="3" title="Secure your seats" subtitle="A simulated checkout for your CineBook booking." onBack={onBack} /><div className="flow-layout"><div className="flow-main"><form className="payment-form" onSubmit={submitPayment}><div className="payment-badge"><ShieldCheck size={17} /> Secure checkout</div>{error && <p className="booking-error" role="alert">{error}</p>}<div className="form-section"><label>Cardholder name<input name="cardholderName" required placeholder="Alex Morgan" /></label><label>Card number<div className="input-with-icon"><input required inputMode="numeric" minLength="12" placeholder="4242 4242 4242 4242" /><CreditCard size={18} /></div></label><div className="form-row"><label>Expiry<input required placeholder="09 / 28" /></label><label>CVC<input required placeholder="123" /></label></div></div><label className="checkbox-label"><input type="checkbox" required /> <span>I agree to the booking terms and cancellation policy.</span></label><button className="primary-button continue-button" type="submit" disabled={processing}>{processing ? 'Confirming booking...' : `Pay $${total.toFixed(2)}`} {!processing && <ArrowRight size={17} />}</button></form></div><BookingSummary movie={movie} cinema={cinema} time={time} date={date} selectedSeats={selectedSeats} total={total} /></div></div>
}

function Confirmation({ movie, cinema, time, date, selectedSeats, total, bookingCode, onReset }) {
  const formattedDate = useMemo(() => date.replace(', ', ', '), [date])
  return <div className="confirmation-page"><div className="confirmation-check"><Check size={29} /></div><span className="section-kicker">Booking confirmed</span><h1>Your seats are<br /><em>waiting.</em></h1><p className="confirmation-intro">We have sent your booking details to your inbox. Show this code at the cinema entrance.</p><div className="ticket-card"><div className={`ticket-art poster poster-${movie.color}`}><span className="poster-title">{movie.title}</span><span className="poster-line">ADMIT ONE</span></div><div className="ticket-details"><div className="ticket-code"><span>Booking code</span><strong>{bookingCode}</strong></div><div className="ticket-grid"><div><small>DATE</small><strong>{formattedDate}</strong></div><div><small>TIME</small><strong>{time}</strong></div><div><small>CINEMA</small><strong>{cinema.name.replace('CineBook ', '')}</strong></div><div><small>SEATS</small><strong>{selectedSeats.join(', ')}</strong></div></div><div className="ticket-total"><span>Total paid</span><strong>${total.toFixed(2)}</strong></div></div></div><button className="secondary-button" onClick={onReset}>Book another film <ArrowRight size={17} /></button></div>
}

export default App

createRoot(document.getElementById('root')).render(<App />)
