<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Email Test</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Optional: Add a modern font like Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
                <h1 class="text-2xl font-bold text-white">Welcome Email Test</h1>
            </div>

            <!-- Body -->
            <div class="p-6">
                <p class="text-gray-600 mb-6 text-center">
                    Enter your email address below. A welcome email will be sent .
                </p>

                <form method="POST" action="{{ route('test.email.send') }}">
                    @csrf
                    <div class="mb-5">
                        <label for="recipient_email" class="block text-sm font-medium text-gray-700 mb-1">
                            Recipient Email Address
                        </label>
                        <input
                            type="email"
                            id="recipient_email"
                            name="recipient_email"
                            value="{{ old('recipient_email') }}"
                            required
                            class="w-full px-4 py-3 border @error('recipient_email') border-red-500 @else border-gray-300 @enderror rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                            placeholder="you@example.com"
                        >
                        @error('recipient_email')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <button
                        type="submit"
                        class="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        Send Welcome Email
                    </button>
                </form>

                @if(session('status'))
                    <div class="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                        <p class="text-green-700 text-center">{{ session('status') }}</p>
                    </div>
                @endif

                @if(session('error'))
                    <div class="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                        <p class="text-red-700 text-center">{{ session('error') }}</p>
                    </div>
                @endif
            </div>
        </div>

        <!-- Optional: Add a subtle footer or branding -->
        <p class="text-center text-gray-500 text-sm mt-6">
            Email Test Interface
        </p>
    </div>
</body>
</html>