<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel</title>
    <!-- You can include Tailwind CSS or your own CSS here -->
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto p-4">
        <h1 class="text-3xl font-bold mb-6">Admin Panel</h1>

        <!-- Optional: Admin Info Display -->
        <div class="mb-6 p-4 bg-blue-50 rounded-lg">
            <p class="font-semibold">Logged in as: <span class="text-blue-700">{{ session('admin_id') }}</span></p>
            <a href="{{ route('admin.logout') }}" class="text-red-500 hover:text-red-700">Logout</a>
        </div>

        <!-- User Reports Section -->
        <h2 class="text-2xl font-semibold mb-4">User Reports</h2>

        @if($reports->isEmpty())
            <p class="text-gray-500">No reports found.</p>
        @else
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                @foreach($reports as $report)
                    <div class="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                        <h3 class="font-bold text-lg mb-2">Report #{{ $report->id }}</h3>
                        <!-- Display reporting user details -->
                        <p><span class="font-semibold">Reporting User:</span></p>
                        <p class="ml-4">ID: {{ $report->reporting_user_id }}</p>
                        <p class="ml-4">Name: {{ $report->reportingUser->name ?? 'N/A' }}</p> <!-- Use the relationship -->
                        <p class="ml-4">Email: {{ $report->reportingUser->email ?? 'N/A' }}</p> <!-- Use the relationship -->

                        <!-- Display reported user details -->
                        <p><span class="font-semibold">Reported User:</span></p>
                        <p class="ml-4">ID: {{ $report->reported_user_id }}</p>
                        <p class="ml-4">Name: {{ $report->reportedUser->name ?? 'N/A' }}</p> <!-- Use the relationship -->
                        <p class="ml-4">Email: {{ $report->reportedUser->email ?? 'N/A' }}</p> <!-- Use the relationship -->

                        <p><span class="font-semibold">Description:</span> {{ $report->reason }}</p>
                        <p><span class="font-semibold">Date/Time:</span> {{ $report->created_at->format('Y-m-d H:i:s') }}</p>
                        <p><span class="font-semibold">Status:</span>
                            <span class="px-2 py-1 text-xs rounded-full
                                @if($report->status === 'pending') bg-yellow-100 text-yellow-800
                                @elseif($report->status === 'reviewed') bg-blue-100 text-blue-800
                                @elseif($report->status === 'action_taken') bg-red-100 text-red-800
                                @else bg-gray-100 text-gray-800 @endif">
                                {{ ucfirst($report->status) }}
                            </span>
                        </p>
                       
                        
                        <form method="POST" action="{{ route('admin.mark-report-reviewed', $report->id) }}" class="mt-2">
                            @csrf
                            @method('PATCH')
                            <button type="submit" class="text-xs bg-green-500 hover:bg-green-700 text-white py-1 px-2 rounded">
                                Mark as Reviewed
                            </button>
                        </form>
                        
                    </div>
                @endforeach
            </div>
        @endif
    </div>
</body>
</html>