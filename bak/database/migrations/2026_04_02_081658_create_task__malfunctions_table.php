<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('task__malfunctions', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(\App\Models\Malfunction::class)->constrained()->cascadeOnUpdate()->cascadeOnUpdate();
            $table->foreignIdFor(\App\Models\Task::class)->constrained()->cascadeOnUpdate()->cascadeOnUpdate();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task__malfunctions');
    }
};
