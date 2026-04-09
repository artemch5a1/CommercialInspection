<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Statistic extends Model
{
    use HasFactory;

    protected $table = 'statistics';

    protected $fillable = [
        'task_id',
        'date_discovery',
        'grade',
        'user_id'
    ];

    protected $casts = [
        'date_discovery' => 'date',
        'grade' => 'float'
    ];

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function findFaults()
    {
        return $this->hasMany(Find_fault::class, 'statistic_id');
    }
}
