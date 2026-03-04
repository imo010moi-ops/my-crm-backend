import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/hooks/useTelegram';
import { appointmentsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin,
  ChevronLeft,
  XCircle,
  CheckCircle,
  Clock3
} from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Appointment } from '@/types';

const statusConfig = {
  pending: { label: 'Ожидает', color: 'bg-yellow-500', icon: Clock3 },
  confirmed: { label: 'Подтверждена', color: 'bg-blue-500', icon: CheckCircle },
  completed: { label: 'Завершена', color: 'bg-green-500', icon: CheckCircle },
  cancelled: { label: 'Отменена', color: 'bg-red-500', icon: XCircle },
  no_show: { label: 'Не пришел', color: 'bg-gray-500', icon: XCircle }
};

export function ClientBookings() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const { showBackButton, hideBackButton, showConfirm, notificationOccurred } = useTelegram();
  const navigate = useNavigate();

  useEffect(() => {
    showBackButton(() => navigate('/'));
    return () => hideBackButton();
  }, [navigate, showBackButton, hideBackButton]);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await appointmentsApi.getMyAppointments();
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (appointment: Appointment) => {
    const confirmed = await showConfirm('Отменить эту запись?');
    
    if (confirmed) {
      try {
        await appointmentsApi.cancelAppointment(appointment.id, 'Отменено клиентом');
        notificationOccurred('success');
        loadAppointments();
      } catch (error) {
        notificationOccurred('error');
        console.error('Error cancelling appointment:', error);
      }
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const aptDate = parseISO(apt.appointmentDate);
    const isUpcoming = !isPast(aptDate) || apt.status === 'pending' || apt.status === 'confirmed';
    
    if (activeTab === 'upcoming') {
      return isUpcoming && apt.status !== 'cancelled';
    } else if (activeTab === 'past') {
      return !isUpcoming || apt.status === 'completed' || apt.status === 'no_show';
    } else if (activeTab === 'cancelled') {
      return apt.status === 'cancelled';
    }
    return true;
  });

  const renderAppointmentCard = (appointment: Appointment) => {
    const status = statusConfig[appointment.status];
    const StatusIcon = status.icon;
    const isUpcoming = appointment.status === 'pending' || appointment.status === 'confirmed';

    return (
      <Card key={appointment.id} className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${status.color} text-white`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              
              <h3 className="font-semibold text-lg">{appointment.serviceName}</h3>
              
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <User className="w-4 h-4" />
                {appointment.masterFirstName} {appointment.masterLastName}
              </div>
              
              {appointment.businessName && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {appointment.businessName}
                </div>
              )}
              
              <div className="flex items-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {format(parseISO(appointment.appointmentDate), 'dd MMMM', { locale: ru })}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {appointment.startTime}
                </div>
              </div>
              
              {appointment.notes && (
                <p className="text-sm text-muted-foreground mt-2">
                  📝 {appointment.notes}
                </p>
              )}
            </div>

            {isUpcoming && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleCancel(appointment)}
                className="text-red-600"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Отменить
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Мои записи</h1>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Предстоящие</TabsTrigger>
            <TabsTrigger value="past">История</TabsTrigger>
            <TabsTrigger value="cancelled">Отмененные</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Нет предстоящих записей</p>
                <Button onClick={() => navigate('/client/masters')}>
                  Записаться
                </Button>
              </div>
            ) : (
              filteredAppointments.map(renderAppointmentCard)
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Нет истории записей</p>
              </div>
            ) : (
              filteredAppointments.map(renderAppointmentCard)
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Нет отмененных записей</p>
              </div>
            ) : (
              filteredAppointments.map(renderAppointmentCard)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
