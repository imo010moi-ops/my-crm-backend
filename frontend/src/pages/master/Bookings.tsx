import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/hooks/useTelegram';
import { appointmentsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CheckCircle, 
  XCircle, 
  MoreVertical,
  ChevronLeft
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Appointment } from '@/types';

const statusConfig = {
  pending: { label: 'Ожидает', color: 'bg-yellow-500', icon: Clock },
  confirmed: { label: 'Подтверждена', color: 'bg-blue-500', icon: CheckCircle },
  completed: { label: 'Завершена', color: 'bg-green-500', icon: CheckCircle },
  cancelled: { label: 'Отменена', color: 'bg-red-500', icon: XCircle },
  no_show: { label: 'Не пришел', color: 'bg-gray-500', icon: XCircle }
};

export function MasterBookings() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const { showBackButton, hideBackButton, showConfirm, notificationOccurred } = useTelegram();
  const navigate = useNavigate();

  useEffect(() => {
    showBackButton(() => navigate('/'));
    return () => hideBackButton();
  }, [navigate, showBackButton, hideBackButton]);

  useEffect(() => {
    loadAppointments();
  }, [activeTab]);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      let response;
      if (activeTab === 'today') {
        response = await appointmentsApi.getTodayAppointments();
      } else if (activeTab === 'week') {
        response = await appointmentsApi.getWeekAppointments();
      } else {
        response = await appointmentsApi.getMyAppointments();
      }
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    const confirmed = await showConfirm(
      status === 'completed' ? 'Отметить запись как завершенную?' :
      status === 'cancelled' ? 'Отменить эту запись?' :
      'Изменить статус записи?'
    );

    if (confirmed) {
      try {
        await appointmentsApi.updateStatus(id, status);
        notificationOccurred('success');
        loadAppointments();
      } catch (error) {
        notificationOccurred('error');
        console.error('Error updating status:', error);
      }
    }
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const status = statusConfig[appointment.status];
    const StatusIcon = status.icon;

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
                <span className="text-sm text-muted-foreground">
                  {format(parseISO(appointment.appointmentDate), 'dd MMM', { locale: ru })}
                </span>
              </div>
              
              <h3 className="font-semibold text-lg">{appointment.serviceName}</h3>
              
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {appointment.startTime}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {appointment.clientName || 'Не указано'}
                </div>
              </div>
              
              {appointment.clientPhone && (
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {appointment.clientPhone}
                </div>
              )}
              
              {appointment.notes && (
                <p className="text-sm text-muted-foreground mt-2">
                  📝 {appointment.notes}
                </p>
              )}
            </div>

            {appointment.status === 'pending' || appointment.status === 'confirmed' ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {appointment.status === 'pending' && (
                    <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'confirmed')}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Подтвердить
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'completed')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Завершить
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                    className="text-red-600"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Отменить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
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
            <TabsTrigger value="today">Сегодня</TabsTrigger>
            <TabsTrigger value="week">Неделя</TabsTrigger>
            <TabsTrigger value="all">Все</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Нет записей на сегодня</p>
              </div>
            ) : (
              appointments.map(renderAppointmentCard)
            )}
          </TabsContent>

          <TabsContent value="week" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Нет записей на этой неделе</p>
              </div>
            ) : (
              appointments.map(renderAppointmentCard)
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Нет записей</p>
              </div>
            ) : (
              appointments.map(renderAppointmentCard)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
