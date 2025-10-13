<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Process Password Request - Admin Panel</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        // Function to handle sending the verification code via AJAX
        async function sendVerificationCode(requestId) {
            const button = document.getElementById('send-code-btn');
            const statusDiv = document.getElementById('action-status');

            // Show loading state
            button.disabled = true;
            button.textContent = 'Sending...';
            statusDiv.className = 'mt-4 p-2 bg-yellow-100 text-yellow-800 text-sm rounded'; // Loading style
            statusDiv.textContent = 'Generating code and sending email...';

            const route = `{{ route("admin.send-password-reset-code", ":id") }}`.replace(':id', requestId);
            const formData = new FormData();
            formData.append('_token', '{{ csrf_token() }}');

            try {
                const response = await fetch(route, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Code sent successfully:', data);

                    // Update UI with success message
                    statusDiv.className = 'mt-4 p-2 bg-green-100 text-green-800 text-sm rounded';
                    statusDiv.textContent = `Success: ${data.message} Code sent to ${data.recovery_email}. Expires at: ${data.expires_at}`;

                    // Optionally, disable the button again or change its text
                    button.disabled = true;
                    button.textContent = 'Code Sent';

                } else {
                    const errorData = await response.json();
                    console.error('Server error:', response.status, errorData);
                    statusDiv.className = 'mt-4 p-2 bg-red-100 text-red-800 text-sm rounded';
                    statusDiv.textContent = `Error: ${errorData.message || 'Failed to send code.'}`;
                }
            } catch (error) {
                console.error('Network error:', error);
                statusDiv.className = 'mt-4 p-2 bg-red-100 text-red-800 text-sm rounded';
                statusDiv.textContent = `Network error: ${error.message}`;
            } finally {
                // Re-enable button regardless of outcome
                button.disabled = false;
                button.textContent = 'Generate Code & Send Email'; // Revert text if not success
            }
        }

        // Function to go back to the main admin panel
        function goBack() {
            window.history.back(); // Go back to the previous page (admin panel)
            // Or use: window.location.href = '{{ route("admin.panel") }}';
        }
    </script>
</head>
<body class="bg-gray-100">
    <div class="min-h-screen flex flex-col">
        <!-- Header -->
        <header class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
                <h1 class="text-2xl font-bold text-gray-900">TOT Admin Panel</h1>
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-700">Logged in as: {{ session('admin_id') }}</span>
                    <a href="{{ route('admin.logout') }}" class="text-sm font-semibold text-gray-900 hover:text-red-500">Logout</a>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-grow p-6">
            <div class="max-w-4xl mx-auto">
                <!-- Back Button -->
                <div class="mb-4">
                    <button onclick="goBack()" class="text-blue-600 hover:text-blue-800 font-medium">
                        &larr; Back to Admin Panel
                    </button>
                </div>

                <h2 class="text-xl font-semibold text-gray-900 mb-6">Process Password Reset Request #{{ $request->id }}</h2>

                <!-- Request Details Card -->
                <div class="bg-white shadow rounded-lg mb-6">
                    <div class="px-4 py-5 sm:p-6">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">Request Information</h3>
                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <p class="text-sm text-gray-600"><span class="font-medium">Request ID:</span> {{ $request->id }}</p>
                                <p class="text-sm text-gray-600"><span class="font-medium">@tot.com Email:</span> {{ $request->email }}</p>
                                <p class="text-sm text-gray-600"><span class="font-medium">Account Creation Date:</span> {{ $request->account_creation_date ?: 'N/A' }}</p>
                                <p class="text-sm text-gray-600"><span class="font-medium">Submitted At:</span> {{ $request->created_at->format('Y-m-d H:i:s') }}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600"><span class="font-medium">Recovery Email:</span> {{ $request->recovery_email }}</p>
                                <p class="text-sm text-gray-600"><span class="font-medium">Status:</span>
                                    <span class="px-2 py-1 text-xs font-semibold rounded-full
                                        @if($request->status === 'pending') bg-yellow-100 text-yellow-800
                                        @elseif($request->status === 'approved' || $request->status === 'code_sent') bg-green-100 text-green-800
                                        @elseif($request->status === 'rejected') bg-red-100 text-red-800
                                        @else bg-gray-100 text-gray-800 @endif">
                                        {{ ucfirst($request->status) }}
                                    </span>
                                </p>
                                <p class="text-sm text-gray-600"><span class="font-medium">Message:</span> {{ $request->message ?: 'N/A' }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Card -->
                <div class="bg-white shadow rounded-lg">
                    <div class="px-4 py-5 sm:p-6">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">Send Verification Code</h3>
                        <p class="text-sm text-gray-600 mb-4">This action will generate a 6-digit code, save it, and send an email to the user's recovery email address ({{ $request->recovery_email }}).</p>
                        <button id="send-code-btn"
                                onclick="sendVerificationCode({{ $request->id }})"
                                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Generate Code & Send Email
                        </button>
                        <div id="action-status" class="mt-2 text-sm"></div>
                    </div>
                </div>

            </div>
        </main>
    </div>
</body>
</html>