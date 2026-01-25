'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { LogOut, Users, LayoutDashboard, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';

type UserProfile = {
    id: string;
    displayName: string;
    numericId: string;
    balance: number;
    email?: string;
    phoneNumber?: string;
};

function UsersTable() {
    // Note: This requires Firestore security rules to allow admin access.
    const { data: users, loading, error } = useCollection<UserProfile>(
        'users'
    );

    if (loading) {
        return (
             <div className="rounded-lg border bg-card p-4">
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
             </div>
        )
    }

    if (error) {
        return (
            <Card className="bg-destructive/10">
                <CardHeader>
                    <CardTitle className="text-destructive">Error Fetching Users</CardTitle>
                    <CardDescription className="text-destructive/80">
                        Could not retrieve user data. Your current Firestore security rules may be blocking this query. For this feature to work, an admin must have read access to the 'users' collection.
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>A list of all registered users in the application.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Display Name</TableHead>
                        <TableHead>Numeric ID</TableHead>
                        <TableHead>Phone Number</TableHead>
                        <TableHead className="text-right">Balance (LGB)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.displayName}</TableCell>
                            <TableCell>{user.numericId}</TableCell>
                            <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
                            <TableCell className="text-right">{(user.balance || 0).toFixed(2)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


export default function AdminDashboardPage() {
    const router = useRouter();
    const { data: users, loading } = useCollection('users');

    const handleLogout = () => {
        document.cookie = 'admin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/admin/login');
    };
    
    const totalUsers = users?.length || 0;
    const totalBalance = users?.reduce((acc, user) => acc + (user.balance || 0), 0) || 0;

  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10 justify-between">
            <Logo className="text-2xl" />
            <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3">
            <TabsTrigger value="dashboard">
                <LayoutDashboard className="mr-2" />
                Dashboard
            </TabsTrigger>
            <TabsTrigger value="users">
                <Users className="mr-2"/>
                Users
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                        Total Users
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalUsers}</div>}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                        Total Balance
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                       {loading ? <Skeleton className="h-8 w-2/3" /> : <div className="text-2xl font-bold">{totalBalance.toFixed(2)} <span className="text-sm text-muted-foreground">LGB</span></div>}
                    </CardContent>
                </Card>
            </div>
          </TabsContent>
          <TabsContent value="users" className="mt-4">
            <UsersTable />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
