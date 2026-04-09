<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'training_mode',
        'weather_conditions',
        'access',        // Добавлено поле access
        'times_day',
        'topic_id',
        'level',
        'user_id',
        'group_id'       // Добавлено поле group_id
    ];

    protected $casts = [
        'user_id' => 'integer',
        'group_id' => 'integer',
        'topic_id' => 'integer',
    ];

    public function topic()
    {
        return $this->belongsTo(Topic::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function taskMalfunctions()
    {
        return $this->hasMany(Task_Malfunction::class, 'task_id');
    }

}
