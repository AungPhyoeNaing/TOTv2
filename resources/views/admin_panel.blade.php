<!DOCTYPE html>
<html lang="en" class="h-full bg-gray-100">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        // Toggle sidebar visibility on smaller screens
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('hidden');
            sidebar.classList.toggle('md:block'); // Show on medium screens and above
        }

        // Simple JavaScript to handle tab switching (now using data attributes)
        function openTab(tabId) {
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });

            // Remove active class from all tab buttons
            document.querySelectorAll('.tab-button').forEach(button => {
                button.classList.remove('bg-indigo-600', 'text-white');
                button.classList.add('text-gray-700', 'hover:bg-gray-100');
            });

            // Show the selected tab content
            const selectedTab = document.getElementById(tabId);
            if (selectedTab) {
                selectedTab.classList.remove('hidden');
            }

            // Add active class to the clicked tab button
            const clickedButton = document.querySelector(`[onclick="openTab('${tabId}')"]`);
            if (clickedButton) {
                clickedButton.classList.remove('text-gray-700', 'hover:bg-gray-100');
                clickedButton.classList.add('bg-indigo-600', 'text-white');
            }
        }

        // Set the first tab as active by default when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            // You can set a default tab here, e.g., openTab('Reports');
            // Or use a data attribute on the button itself to indicate default
            const defaultTab = document.querySelector('.tab-button[data-default="true"]');
            if (defaultTab) {
                 const tabId = defaultTab.getAttribute('data-tab');
                 openTab(tabId);
            } else {
                 // Fallback to first tab if no default is specified
                 const firstTabButton = document.querySelector('.tab-button');
                 if (firstTabButton) {
                     const tabId = firstTabButton.getAttribute('data-tab');
                     openTab(tabId);
                 }
            }
        });
    </script>
    <style>
        /* Optional: Add subtle animations */
        .tab-content {
            transition: opacity 0.3s ease-in-out;
        }
    </style>
</head>
<body class="h-full">
    <!-- Off-canvas menu for mobile, show/hide based on off-canvas menu state. -->
    <div class="relative z-50 lg:hidden" role="dialog" aria-modal="true" id="mobile-menu" style="display: none;">
        <!--
          Off-canvas menu backdrop, show/hide based on off-canvas menu state.

          Entering: "transition-opacity ease-linear duration-300"
            From: "opacity-0"
            To: "opacity-100"
          Leaving: "transition-opacity ease-linear duration-300"
            From: "opacity-100"
            To: "opacity-0"
        -->
        <div class="fixed inset-0 bg-gray-900/80"></div>

        <div class="fixed inset-0 flex">
            <!--
              Off-canvas menu, show/hide based on off-canvas menu state.

              Entering: "transition ease-in-out duration-300 transform"
                From: "-translate-x-full"
                To: "translate-x-0"
              Leaving: "transition ease-in-out duration-300 transform"
                From: "translate-x-0"
                To: "-translate-x-full"
            -->
            <div id="sidebar" class="relative mr-16 flex w-full max-w-xs flex-1">
                <!-- Sidebar component, swap this element with another sidebar if you like -->
                <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-4 pb-4"> <!-- Reduced padding-x from px-6 to px-4 -->
                    <div class="flex h-16 shrink-0 items-center">
                        <span class="text-white font-bold text-xl">TOT Admin</span>
                    </div>
                    <nav class="flex flex-1 flex-col">
                        <ul role="list" class="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" class="-mx-2 space-y-1">
                                    <li>
                                        <button
                                            class="tab-button flex items-center w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-200 hover:bg-gray-800"
                                            onclick="openTab('Reports')"
                                            data-tab="Reports"
                                            data-default="true" <!-- Make Reports the default -->
                                        >
                                            <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                            </svg>
                                            User Reports
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            class="tab-button flex items-center w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-200 hover:bg-gray-800"
                                            onclick="openTab('UserManagement')"
                                            data-tab="UserManagement"
                                        >
                                            <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                            </svg>
                                            User Management
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            class="tab-button flex items-center w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-200 hover:bg-gray-800"
                                            onclick="openTab('PostManagement')"
                                            data-tab="PostManagement"
                                        >
                                            <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                                            </svg>
                                            Post Management
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            class="tab-button flex items-center w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-200 hover:bg-gray-800"
                                            onclick="openTab('PasswordRequests')"
                                            data-tab="PasswordRequests"
                                        >
                                            <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                                            </svg>
                                            Password Requests
                                        </button>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    </div>

    <!-- Static sidebar for desktop -->
    <div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 lg:flex-col"> <!-- Reduced width from lg:w-72 to lg:w-60 -->
        <!-- Sidebar component -->
        <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-4 pb-4"> <!-- Reduced padding-x from px-6 to px-4 -->
            <div class="flex h-16 shrink-0 items-center border-b border-gray-800">
                <span class="text-white font-bold text-xl">TOT Admin</span>
            </div>
            <nav class="flex flex-1 flex-col">
                <ul role="list" class="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" class="-mx-2 space-y-1">
                            <li>
                                <button
                                    class="tab-button flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-200 hover:bg-gray-800"
                                    onclick="openTab('Reports')"
                                    data-tab="Reports"
                                    data-default="true" <!-- Make Reports the default -->
                                >
                                    <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                    </svg>
                                    User Reports
                                </button>
                            </li>
                            <li>
                                <button
                                    class="tab-button flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-200 hover:bg-gray-800"
                                    onclick="openTab('UserManagement')"
                                    data-tab="UserManagement"
                                >
                                    <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                    </svg>
                                    User Management
                                </button>
                            </li>
                            <li>
                                <button
                                    class="tab-button flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-200 hover:bg-gray-800"
                                    onclick="openTab('PostManagement')"
                                    data-tab="PostManagement"
                                >
                                    <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                                    </svg>
                                    Post Management
                                </button>
                            </li>
                            <li>
                                <button
                                    class="tab-button flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-200 hover:bg-gray-800"
                                    onclick="openTab('PasswordRequests')"
                                    data-tab="PasswordRequests"
                                >
                                    <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                                    </svg>
                                    Password Requests
                                </button>
                            </li>
                        </ul>
                    </li>
                </ul>
            </nav>
        </div>
    </div>

    <!-- Main Content Area -->
    <div class="lg:pl-60"> <!-- Reduced pl from lg:pl-72 to lg:pl-60 to match sidebar width -->
        <div class="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
            <!-- Sidebar toggle button for mobile -->
            <button type="button" class="-m-2.5 p-2.5 text-gray-700 lg:hidden" onclick="toggleSidebar()">
                <span class="sr-only">Open sidebar</span>
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>

            <!-- Separator -->
            <div class="h-6 w-px bg-gray-900/10 lg:hidden" aria-hidden="true"></div>

            <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div class="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
                    <!-- Admin Info Display -->
                    <div class="hidden sm:flex sm:flex-col sm:items-end">
                        <p class="text-sm leading-6 text-gray-900">Logged in as</p>
                        <p class="text-sm font-semibold leading-6 text-indigo-600">{{ session('admin_id') }}</p>
                    </div>
                    <div class="h-6 w-px bg-gray-900/10 hidden sm:block" aria-hidden="true"></div>
                    <a href="{{ route('admin.logout') }}" class="text-sm font-semibold leading-6 text-gray-900 hover:text-red-500">Logout <span aria-hidden="true">&rarr;</span></a>
                </div>
            </div>
        </div>

        <main class="py-6">
            <div class="px-4 sm:px-6 lg:px-8">
                <!-- Tab Content -->
                <!-- User Reports Tab -->
                <div id="Reports" class="tab-content hidden">
                    <h2 class="text-2xl font-semibold text-gray-900 mb-4">User Reports</h2>
                    @if($reports->isEmpty())
                        <p class="text-gray-500">No reports found.</p>
                    @else
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            @foreach($reports as $report)
                                <div class="bg-white overflow-hidden shadow rounded-lg">
                                    <div class="px-4 py-5 sm:p-6">
                                        <h3 class="text-lg font-medium text-gray-900">Report #{{ $report->id }}</h3>
                                        <div class="mt-4 space-y-2">
                                            <!-- Display reporting user details -->
                                            <div class="border-l-4 border-blue-500 pl-4 py-1">
                                                <h4 class="text-sm font-medium text-gray-700">Reporting User</h4>
                                                <p class="text-sm text-gray-600">ID: {{ $report->reporting_user_id }}</p>
                                                <p class="text-sm text-gray-600">Name: {{ $report->reportingUser->name ?? 'N/A' }}</p>
                                                <p class="text-sm text-gray-600">Email: {{ $report->reportingUser->email ?? 'N/A' }}</p>
                                            </div>
                                            <!-- Display reported user details -->
                                            <div class="border-l-4 border-red-500 pl-4 py-1">
                                                <h4 class="text-sm font-medium text-gray-700">Reported User</h4>
                                                <p class="text-sm text-gray-600">ID: {{ $report->reported_user_id }}</p>
                                                <p class="text-sm text-gray-600">Name: {{ $report->reportedUser->name ?? 'N/A' }}</p>
                                                <p class="text-sm text-gray-600">Email: {{ $report->reportedUser->email ?? 'N/A' }}</p>
                                            </div>
                                            <p class="text-sm text-gray-600"><span class="font-medium">Description:</span> {{ $report->reason }}</p>
                                            <p class="text-sm text-gray-600"><span class="font-medium">Date/Time:</span> {{ $report->created_at->format('Y-m-d H:i:s') }}</p>
                                            <div>
                                                <span class="font-medium">Status:</span>
                                                <span class="ml-1 px-2 py-1 text-xs font-semibold rounded-full
                                                    @if($report->status === 'pending') bg-yellow-100 text-yellow-800
                                                    @elseif($report->status === 'reviewed') bg-blue-100 text-blue-800
                                                    @elseif($report->status === 'action_taken') bg-red-100 text-red-800
                                                    @else bg-gray-100 text-gray-800 @endif">
                                                    {{ ucfirst($report->status) }}
                                                </span>
                                            </div>
                                            <!-- Optional: Add a button to mark as reviewed -->
                                            <!--
                                            <form method="POST" action="{{ route('admin.mark-report-reviewed', $report->id) }}" class="mt-2 inline">
                                                @csrf
                                                @method('PATCH')
                                                <button type="submit" class="text-xs bg-green-500 hover:bg-green-700 text-white py-1 px-2 rounded">
                                                    Mark as Reviewed
                                                </button>
                                            </form>
                                            -->
                                        </div>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    @endif
                </div>

                <!-- User Management Tab -->
                <div id="UserManagement" class="tab-content hidden">
                    <h2 class="text-2xl font-semibold text-gray-900 mb-4">User Management</h2>
                    @if($users->isEmpty())
                        <p class="text-gray-500">No users found.</p>
                    @else
                        <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table class="min-w-full divide-y divide-gray-300">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th scope="col" class="py-3 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6">ID</th>
                                        <th scope="col" class="py-3 px-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Name</th>
                                        <th scope="col" class="py-3 px-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">@tot.com Email</th>
                                        <th scope="col" class="py-3 px-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Recovery Email</th>
                                        <th scope="col" class="relative py-3 pl-3 pr-4 sm:pr-6">
                                            <span class="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 bg-white">
                                    @foreach($users as $user)
                                        <tr class="hover:bg-gray-50">
                                            <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{{ $user->id }}</td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ $user->name }}</td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ $user->email }}</td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ $user->recovery_email ?? 'N/A' }}</td>
                                            <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <form method="POST" action="{{ route('admin.delete-user', $user->id) }}" class="inline" onsubmit="return confirm('Are you sure you want to delete user {{ $user->name }} (ID: {{ $user->id }})? This action cannot be undone.')">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button type="submit" class="text-red-600 hover:text-red-900">
                                                        Delete<span class="sr-only"> for user {{ $user->id }}</span>
                                                    </button>
                                                </form>
                                            </td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    @endif
                </div>

                <!-- Post Management Tab -->
                <div id="PostManagement" class="tab-content hidden">
                    <h2 class="text-2xl font-semibold text-gray-900 mb-4">Post Management</h2>
                    @if($posts->isEmpty())
                        <p class="text-gray-500">No posts found.</p>
                    @else
                        <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table class="min-w-full divide-y divide-gray-300">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th scope="col" class="py-3 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6">ID</th>
                                        <th scope="col" class="py-3 px-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Owner</th>
                                        <th scope="col" class="py-3 px-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Content</th>
                                        <th scope="col" class="py-3 px-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Thumbnail</th>
                                        <th scope="col" class="py-3 px-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Media Type</th>
                                        <th scope="col" class="py-3 px-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Media URL</th>
                                        <th scope="col" class="py-3 px-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Likes</th>
                                        <th scope="col" class="py-3 px-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Sads</th>
                                        <th scope="col" class="py-3 px-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Angries</th>
                                        <th scope="col" class="py-3 px-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Comments</th>
                                        <th scope="col" class="py-3 px-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Created At</th>
                                        <th scope="col" class="relative py-3 pl-3 pr-4 sm:pr-6">
                                            <span class="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 bg-white">
                                    @foreach($posts as $post)
                                        <tr class="hover:bg-gray-50">
                                            <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{{ $post->id }}</td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ $post->user->name ?? 'Unknown' }}</td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ Str::limit($post->body, 50) }}</td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                @if($post->media_url && ($post->media_type == 'image' || Str::startsWith(Str::lower($post->media_url), ['http', 'https']) && preg_match('/\.(jpg|jpeg|png|gif|webp|bmp)$/i', parse_url($post->media_url, PHP_URL_PATH))))
                                                    <a href="{{ $post->media_url }}" target="_blank" class="inline-block">
                                                        <img src="{{ $post->media_url }}" alt="Post Media Thumbnail" class="h-12 w-12 object-cover border border-gray-300 rounded">
                                                    </a>
                                                @else
                                                    <span class="text-gray-400">N/A</span>
                                                @endif
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ $post->media_type ?? 'N/A' }}</td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                @if($post->media_url)
                                                    <a href="{{ $post->media_url }}" target="_blank" class="text-indigo-600 hover:text-indigo-900">View</a>
                                                @else
                                                    <span class="text-gray-400">N/A</span>
                                                @endif
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ $post->likes_count ?? 0 }}</td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ $post->sads_count ?? 0 }}</td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ $post->angries_count ?? 0 }}</td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ $post->comments_count ?? 0 }}</td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ $post->created_at->format('Y-m-d H:i:s') }}</td>
                                            <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <form method="POST" action="{{ route('admin.delete-post', $post->id) }}" class="inline" onsubmit="return confirm('Are you sure you want to delete this post (ID: {{ $post->id }})? This action cannot be undone.')">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button type="submit" class="text-red-600 hover:text-red-900">
                                                        Delete<span class="sr-only"> for post {{ $post->id }}</span>
                                                    </button>
                                                </form>
                                            </td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    @endif
                </div>

                <!-- Password Requests Tab -->
                <div id="PasswordRequests" class="tab-content hidden">
                    <h2 class="text-2xl font-semibold text-gray-900 mb-4">Password Reset Requests</h2>
                    <p class="text-gray-500">Content for password reset requests will be added here.</p>
                    <!-- Future content will go here -->
                </div>
            </div>
        </main>
    </div>
</body>
</html>