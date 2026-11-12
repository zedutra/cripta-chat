<?php

use App\Http\Controllers\Chat\ChatController;
use App\Http\Controllers\Chat\CriptoAssistenteController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [ChatController::class, 'index'])->name('dashboard');
    Route::get('chat/sync', [ChatController::class, 'sync'])->name('chat.sync');
    Route::put('chat/keys', [ChatController::class, 'updatePublicKey'])->name('chat.keys.update');
    Route::post('chat/contacts', [ChatController::class, 'addContact'])->name('chat.contacts.store');
    Route::post('chat/messages', [ChatController::class, 'sendMessage'])->name('chat.messages.store');
    Route::get('chat/assistant', [CriptoAssistenteController::class, 'index'])->name('chat.assistant.index');
    Route::post('chat/assistant', [CriptoAssistenteController::class, 'store'])
        ->middleware('throttle:20,1')
        ->name('chat.assistant.store');
});

require __DIR__.'/settings.php';
