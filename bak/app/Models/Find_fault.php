<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Find_fault extends Model
{
    use HasFactory;

    protected $table = 'find_faults';

    protected $fillable = [
        'user_id',
        'task__malfunction_id',  // ДВОЙНОЕ ПОДЧЕРКИВАНИЕ!
        'statistic_id',
        'right',
        'comment'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function taskMalfunction()
    {
        return $this->belongsTo(Task_Malfunction::class, 'task__malfunction_id');
    }

    public function statistic()
    {
        return $this->belongsTo(Statistic::class);
    }
}
