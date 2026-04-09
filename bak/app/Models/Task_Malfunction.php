<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task_Malfunction extends Model
{
    protected $table = 'task__malfunctions';

    protected $fillable = [
        'task_id',
        'malfunction_id'
    ];

    public function task()
    {
        return $this->belongsTo(Task::class, 'task_id');
    }

    public function malfunction()
    {
        return $this->belongsTo(Malfunction::class, 'malfunction_id');
    }
}
