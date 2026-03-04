import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTelegram } from '@/hooks/useTelegram';
import { servicesApi, appointmentsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  ChevronLeft, 
  Clock, 
  DollarSign, 
  User, 
  Phone,
  CheckCircle,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Service, TimeSlot } from '@/types';

export function ClientBooking() {
  const { masterId } = useParams<{ masterId: string }>();
  const { user } = useAuth();
  const { showBackButton, hideBackButton, showMainButton, hideMainButton, showConfirm, notificationOccurred } = useTelegram();
  const navigate = useNavigate();

  const [step, setStep] = useState<'service' | 'date' | 'time' | 'confirm'>('service');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientPhone, setClientPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    showBackButton(() => {
      if (step === 'service') navigate('/client/masters');
      else if (step === 'date') setStep('service');
      else if (step === 'time') setStep('date');
      else if (step === 'confirm') setStep('time');
    });
    return () => hideBackButton();
  }, [step, navigate, showBackButton, hideBackButton]);

  useEffect(() => {
    loadServices();
  }, [masterId]);

  useEffect(() => {
    if (selectedDate && masterId) {
      loadAvailableSlots();
    }
  }, [selectedDate, masterId]);

  useEffect(() => {
    if (step === 'confirm' && selectedService && selectedDate && selectedTime) {
      showMainButton('Подтвердить запись', handleConfirm);
    } else {
      hideMainButton();
    }
    return () => hideMainButton();
  }, [step, selectedService, selectedDate, selectedTime]);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const response = await servicesApi.getMasterServices(Number(masterId));
      setServices(response.data.services || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate) return;
    
    try {
      setIsLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await appointmentsApi.getAvailableSlots(Number(masterId), dateStr);
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setStep('date');
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setStep('time');
    }
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;

    const confirmed = await showConfirm('Подтвердить запись?');
    if (!confirmed) return;

    try {
      setIsLoading(true);
      await appointmentsApi.createAppointment({
        masterId: Number(masterId),
        serviceId: selectedService.id,
        appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedTime,
        clientName: user?.firstName,
        clientPhone: clientPhone || undefined,
        notes: notes || undefined
      });

      notificationOccurred('success');
      navigate('/client/bookings');
    } catch (error) {
      notificationOccurred('error');
      console.error('Error creating appointment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
  };

  // Step 1: Select Service
  if (step === 'service') {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/client/masters')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Выберите услугу</h1>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Нет доступных услуг</p>
            </div>
          ) : (
            services.map((service) => (
              <Card 
                key={service.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectService(service)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        <Badge variant="secondary">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {service.price} ₽
                        </Badge>
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDuration(service.durationMinutes)}
                        </Badge>
                      </div>
                    </div>
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: service.color }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // Step 2: Select Date
  if (step === 'date') {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => setStep('service')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Выберите дату</h1>
          </div>
        </div>

        <div className="p-4">
          <Card>
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleSelectDate}
                disabled={(date) => isBefore(date, startOfDay(new Date()))}
                fromDate={new Date()}
                toDate={addDays(new Date(), 30)}
                className="mx-auto"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 3: Select Time
  if (step === 'time') {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => setStep('date')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Выберите время</h1>
              <p className="text-sm text-muted-foreground">
                {selectedDate && format(selectedDate, 'dd MMMM yyyy', { locale: ru })}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Нет свободного времени на эту дату</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setStep('date')}
              >
                Выбрать другую дату
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant="outline"
                  onClick={() => handleSelectTime(slot.time)}
                  className="h-12"
                >
                  {slot.time}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 4: Confirm
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => setStep('time')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Подтверждение</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Service Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Детали записи</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Услуга</span>
                <span className="font-medium">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Дата</span>
                <span className="font-medium">
                  {selectedDate && format(selectedDate, 'dd MMMM yyyy', { locale: ru })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Время</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Длительность</span>
                <span className="font-medium">
                  {selectedService && formatDuration(selectedService.durationMinutes)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Стоимость</span>
                <span className="font-medium text-lg">{selectedService?.price} ₽</span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Контактная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Телефон
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+7 (999) 999-99-99"
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Примечания</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Дополнительная информация для мастера"
                  className="w-full mt-1 p-2 border rounded-md h-20 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full h-12"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {isLoading ? 'Создание записи...' : 'Подтвердить запись'}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
