

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { ChevronLeft, Loader2, Users } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { createClient } from '@/lib/utils';

const defaultAvatarUrl = "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/IMG_20260402_224703_814.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvSU1HXzIwMjYwNDAyXzIyNDcwM184MTQuanBnIiwiaWF0IjoxNzc1MTUwMzMxLCJleHAiOjE4MDY2ODYzMzF9.o5z7uxui9h2o-GVKG9znk4TKBAoK4WMsLKY6NPZ8_1o";

type UserProfile = {
    id: string;
    display_name: string;
    numeric_id: string;
    photo_url?: string;
};

type Order = {
    amount: number;
    status: string;
};

// Component for a single invited user row
const InvitedUserRow = ({ user }: { user: UserProfile }) => {
    const supabase = createClient();
    const [stats, setStats] = useState({ income: 0, orders: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAgentData = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('orders')
              .select('amount')
              .eq('user_id', user.id)
              .eq('status', 'completed');
            
            let totalOrderAmount = 0;
            if (data) {
                totalOrderAmount = data.reduce((sum, order) => sum + order.amount, 0);
            }
            
            setStats({ income: totalOrderAmount, orders: data?.length || 0 });
            setLoading(false);
        };
        fetchAgentData();
    }, [supabase, user.id]);

    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={defaultAvatarUrl} />
                        <AvatarFallback>{user.display_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{user.display_name}</p>
                        <p className="text-xs text-muted-foreground">UID: {user.numeric_id}</p>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `₹${stats.income.toFixed(2)}`}
            </TableCell>
            <TableCell className="text-right">
                <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/users/${user.id}`}>View User</Link>
                </Button>
            </TableCell>
        </TableRow>
    );
};

export default function UserInvitesPage() {
    const params = useParams();
    const inviterId = params.userId as string;
    const supabase = createClient();

    const [inviter, setInviter] = useState<UserProfile | null>(null);
    const [invitedUsers, setInvitedUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchData = async () => {
            if (!inviterId) return;
            setLoading(true);

            const [inviterRes, invitedRes] = await Promise.all([
                supabase.from('users').select('*').eq('id', inviterId).single(),
                supabase.from('users').select('*').eq('inviter_uid', inviterId)
            ]);

            if(inviterRes.data) setInviter(inviterRes.data as UserProfile);
            if(invitedRes.data) setInvitedUsers(invitedRes.data as UserProfile[]);
            
            setLoading(false);
        }
        fetchData();
    }, [inviterId, supabase]);

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p>Loading Invites...</p>
            </div>
        )
    }
    
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
             <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon" className="h-8 w-8">
                    <Link href={`/admin/users/${inviterId}`}>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                 <h1 className="text-xl font-semibold">
                    Users Invited by {inviter?.display_name || '...'} (UID: {inviter?.numeric_id})
                 </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Invited Users ({invitedUsers?.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Total Buy Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invitedUsers && invitedUsers.length > 0 ? (
                                invitedUsers.map(user => <InvitedUserRow key={user.id} user={user} />)
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">This user has not invited anyone.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
    )
}
